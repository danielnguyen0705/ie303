package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.PersonalizedQuestionRequest;
import com.ie303.uifive.dto.res.QuestionResponse;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.entity.QuestionOption;
import com.ie303.uifive.entity.QuestionType;
import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.mapper.QuestionMapper;
import com.ie303.uifive.repo.QuestionOptionRepo;
import com.ie303.uifive.repo.QuestionRepo;
import com.ie303.uifive.repo.UserQuestionHistoryRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PersonalizedPracticeService {

    private static final int MIN_AUTO_QUESTION_COUNT = 10;
    private static final int TARGET_AUTO_QUESTION_COUNT = 20;
    private static final int QUESTIONS_PER_WRONG_REFERENCE = 4;
    private static final int MAX_QUESTION_COUNT = 20;
    private static final Set<QuestionType> SUPPORTED_PERSONALIZED_TYPES = Set.of(
            QuestionType.QUALITATIVE_MC,
            QuestionType.CLOZE_MC,
            QuestionType.LIMITED_FILL,
            QuestionType.WORD_FORM,
            QuestionType.VERB_FORM
    );

    private final UserService userService;
    private final UserQuestionHistoryRepo userQuestionHistoryRepo;
    private final AiGenerationService aiGenerationService;
    private final QuestionRepo questionRepo;
    private final QuestionOptionRepo questionOptionRepo;
    private final QuestionMapper questionMapper;

    public List<QuestionResponse> generateFromWrongQuestions(PersonalizedQuestionRequest request) {
        User currentUser = userService.getCurrentUser();
        ensureVip(currentUser);

        List<Question> wrongQuestions = resolveWrongQuestions(currentUser.getId(), request);

        if (wrongQuestions.isEmpty()) {
            throw new AppException(ErrorCode.NO_WRONG_QUESTIONS_FOUND);
        }

        int count = normalizeCount(request.questionCount(), wrongQuestions.size());
        List<String> allowedTargetAnswers = resolveAllowedTargetAnswers(wrongQuestions);
        List<QuestionType> allowedQuestionTypes = resolveAllowedQuestionTypes(wrongQuestions);
        String context = buildContext(currentUser, request, wrongQuestions, allowedTargetAnswers, allowedQuestionTypes, count);

        List<AiGenerationService.GeneratedPersonalizedQuestionDraft> drafts = aiGenerationService.generatePersonalizedQuestions(
                context,
                count,
                null
        );

        List<AiGenerationService.GeneratedPersonalizedQuestionDraft> validDrafts = filterValidPersonalizedDrafts(
                drafts,
                allowedTargetAnswers,
                allowedQuestionTypes
        );
        if (validDrafts.isEmpty()) {
            throw new AppException(
                    ErrorCode.AI_INVALID_RESPONSE,
                    "Generated personalized questions did not stay on the target answers"
            );
        }

        List<Question> generatedQuestions = validDrafts.stream()
                .map(draft -> {
                    Question question = new Question();
                    QuestionType questionType = normalizeGeneratedQuestionType(draft.questionType(), allowedQuestionTypes);
                    question.setQuestionType(questionType);
                    question.setContent(draft.content());
                    question.setExplanation(draft.explanation());
                    question.setCorrectAnswer(resolveStoredCorrectAnswer(draft, questionType));
                    return question;
                })
                .toList();

        List<Question> savedQuestions = questionRepo.saveAll(generatedQuestions);

        List<QuestionOption> optionsToSave = new ArrayList<>();
        for (int i = 0; i < savedQuestions.size(); i++) {
            Question savedQuestion = savedQuestions.get(i);
            AiGenerationService.GeneratedPersonalizedQuestionDraft draft = validDrafts.get(i);

            List<QuestionOption> optionEntities = buildOptions(savedQuestion, draft);
            optionsToSave.addAll(optionEntities);
            savedQuestion.setOptions(optionEntities);
        }

        if (!optionsToSave.isEmpty()) {
            questionOptionRepo.saveAll(optionsToSave);
        }

        return savedQuestions.stream()
                .map(questionMapper::toResponse)
                .toList();
    }

    private List<String> resolveAllowedTargetAnswers(List<Question> wrongQuestions) {
        Set<String> answers = new LinkedHashSet<>();

        for (Question question : wrongQuestions) {
            List<QuestionOption> options = questionOptionRepo.findByQuestionId(question.getId());
            String targetAnswer = resolveTargetAnswer(question, options);
            if (targetAnswer != null && !targetAnswer.isBlank()) {
                answers.add(targetAnswer.trim());
            }
        }

        return new ArrayList<>(answers);
    }

    private List<QuestionType> resolveAllowedQuestionTypes(List<Question> wrongQuestions) {
        Set<QuestionType> resolved = new LinkedHashSet<>();

        for (Question question : wrongQuestions) {
            QuestionType questionType = question.getQuestionType();
            if (questionType == null) {
                continue;
            }

            if (SUPPORTED_PERSONALIZED_TYPES.contains(questionType)) {
                resolved.add(questionType);
                continue;
            }

            resolved.add(QuestionType.QUALITATIVE_MC);
        }

        if (resolved.isEmpty()) {
            resolved.add(QuestionType.QUALITATIVE_MC);
        }

        return new ArrayList<>(resolved);
    }

    private List<AiGenerationService.GeneratedPersonalizedQuestionDraft> filterValidPersonalizedDrafts(
            List<AiGenerationService.GeneratedPersonalizedQuestionDraft> drafts,
            List<String> allowedTargetAnswers,
            List<QuestionType> allowedQuestionTypes
    ) {
        Set<String> normalizedTargets = allowedTargetAnswers.stream()
                .map(this::normalizeComparableAnswer)
                .filter(value -> !value.isBlank())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        return drafts.stream()
                .filter(draft -> hasValidPersonalizedStructure(draft, allowedQuestionTypes))
                .filter(draft -> matchesAllowedTargetAnswer(draft, normalizedTargets))
                .toList();
    }

    private boolean hasValidPersonalizedStructure(
            AiGenerationService.GeneratedPersonalizedQuestionDraft draft,
            List<QuestionType> allowedQuestionTypes
    ) {
        if (draft == null || draft.content() == null || draft.content().isBlank()) {
            return false;
        }

        QuestionType questionType = normalizeGeneratedQuestionType(draft.questionType(), allowedQuestionTypes);
        if (questionType == null) {
            return false;
        }

        if (isOptionBasedType(questionType)) {
            List<AiGenerationService.GeneratedMcqOptionDraft> options = draft.options();
            if (options == null || options.size() != 4) {
                return false;
            }

            Set<String> optionKeys = options.stream()
                    .map(option -> option == null ? null : normalizeOptionKey(option.optionKey()))
                    .collect(Collectors.toCollection(LinkedHashSet::new));

            if (optionKeys.size() != 4 || !optionKeys.containsAll(List.of("A", "B", "C", "D"))) {
                return false;
            }

            return !resolveCorrectOptionContent(draft).isBlank();
        }

        return draft.correctAnswer() != null && !draft.correctAnswer().isBlank();
    }

    private boolean matchesAllowedTargetAnswer(
            AiGenerationService.GeneratedPersonalizedQuestionDraft draft,
            Set<String> normalizedTargets
    ) {
        if (normalizedTargets.isEmpty()) {
            return true;
        }

        String normalizedAnswer = normalizeComparableAnswer(resolveComparableAnswerText(draft));
        return !normalizedAnswer.isBlank() && normalizedTargets.contains(normalizedAnswer);
    }

    private List<QuestionOption> buildOptions(Question question, AiGenerationService.GeneratedPersonalizedQuestionDraft draft) {
        if (!isOptionBasedType(question.getQuestionType())) {
            return List.of();
        }

        List<AiGenerationService.GeneratedMcqOptionDraft> draftOptions = draft.options() == null
                ? List.of()
                : draft.options();

        List<QuestionOption> options = new ArrayList<>();
        String correctKey = resolveCorrectOptionKey(draft);

        for (AiGenerationService.GeneratedMcqOptionDraft draftOption : draftOptions) {
            if (draftOption == null || draftOption.content() == null || draftOption.content().isBlank()) {
                continue;
            }

            QuestionOption option = new QuestionOption();
            String optionKey = normalizeOptionKey(draftOption.optionKey());

            option.setQuestion(question);
            option.setOptionKey(optionKey);
            option.setContent(draftOption.content().trim());
            option.setCorrect(optionKey.equals(correctKey));
            options.add(option);
        }

        return options;
    }

    private QuestionType normalizeGeneratedQuestionType(String rawType, List<QuestionType> allowedQuestionTypes) {
        if (rawType == null || rawType.isBlank()) {
            return allowedQuestionTypes.contains(QuestionType.QUALITATIVE_MC)
                    ? QuestionType.QUALITATIVE_MC
                    : allowedQuestionTypes.isEmpty() ? null : allowedQuestionTypes.get(0);
        }

        try {
            QuestionType parsed = QuestionType.valueOf(rawType.trim().toUpperCase());
            return allowedQuestionTypes.contains(parsed) ? parsed : null;
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }

    private boolean isOptionBasedType(QuestionType questionType) {
        return questionType == QuestionType.QUALITATIVE_MC
                || questionType == QuestionType.CLOZE_MC;
    }

    private String resolveStoredCorrectAnswer(
            AiGenerationService.GeneratedPersonalizedQuestionDraft draft,
            QuestionType questionType
    ) {
        if (!isOptionBasedType(questionType)) {
            return nullToEmpty(draft.correctAnswer());
        }

        return resolveCorrectOptionKey(draft);
    }

    private String resolveCorrectOptionKey(AiGenerationService.GeneratedPersonalizedQuestionDraft draft) {
        String normalizedCorrectAnswer = normalizeComparableAnswer(draft.correctAnswer());

        if (draft.options() != null) {
            for (AiGenerationService.GeneratedMcqOptionDraft option : draft.options()) {
                if (option == null) {
                    continue;
                }

                String optionKey = normalizeOptionKey(option.optionKey());
                if (normalizedCorrectAnswer.equals(normalizeComparableAnswer(optionKey))) {
                    return optionKey;
                }

                if (option.content() != null
                        && normalizedCorrectAnswer.equals(normalizeComparableAnswer(option.content()))) {
                    return optionKey;
                }
            }
        }

        return normalizeOptionKey(draft.correctAnswer());
    }

    private String resolveCorrectOptionContent(AiGenerationService.GeneratedPersonalizedQuestionDraft draft) {
        String correctKey = resolveCorrectOptionKey(draft);
        if (draft.options() == null) {
            return "";
        }

        return draft.options().stream()
                .filter(option -> option != null
                        && correctKey.equals(normalizeOptionKey(option.optionKey()))
                        && option.content() != null
                        && !option.content().isBlank())
                .map(AiGenerationService.GeneratedMcqOptionDraft::content)
                .findFirst()
                .orElse("");
    }

    private String resolveComparableAnswerText(AiGenerationService.GeneratedPersonalizedQuestionDraft draft) {
        QuestionType questionType = normalizeGeneratedQuestionType(
                draft.questionType(),
                new ArrayList<>(SUPPORTED_PERSONALIZED_TYPES)
        );

        if (questionType != null && isOptionBasedType(questionType)) {
            return resolveCorrectOptionContent(draft);
        }

        return nullToEmpty(draft.correctAnswer());
    }

    private String normalizeOptionKey(String key) {
        if (key == null || key.isBlank()) {
            return "A";
        }

        String upper = key.trim().toUpperCase();
        return switch (upper) {
            case "A", "B", "C", "D" -> upper;
            default -> "A";
        };
    }

    private List<Question> resolveWrongQuestions(Long userId, PersonalizedQuestionRequest request) {
        if (request.gradeId() == null || request.unitNumber() == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "gradeId and unitNumber are required");
        }

        if (request.unitNumber() <= 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "unitNumber must be greater than 0");
        }

        List<Long> wrongQuestionIds = userQuestionHistoryRepo.findDistinctWrongQuestionIdsByUserAndGradeAndUnit(
                userId,
                request.gradeId(),
                request.unitNumber()
        );

        if (wrongQuestionIds == null || wrongQuestionIds.isEmpty()) {
            return List.of();
        }

        Map<Long, Question> questionsById = questionRepo.findAllById(wrongQuestionIds).stream()
                .collect(Collectors.toMap(Question::getId, question -> question, (left, right) -> left, LinkedHashMap::new));

        return wrongQuestionIds.stream()
                .distinct()
                .map(questionsById::get)
                .filter(question -> question != null)
                .toList();
    }

    private String buildContext(
            User user,
            PersonalizedQuestionRequest request,
            List<Question> wrongQuestions,
            List<String> allowedTargetAnswers,
            List<QuestionType> allowedQuestionTypes,
            int requestedCount
    ) {
        StringBuilder builder = new StringBuilder();
        builder.append("Tao bo cau hoi ca nhan hoa cho hoc sinh dua tren cac cau lam sai.\n");
        builder.append("Muc tieu: tao cau hoi moi de hoc sinh luyen lai DUNG tu/cum tu/cau truc da sai, khong doi sang kien thuc khac.\n");
        builder.append("Neu tham chieu co target answer thi dap an dung cua cau moi phai giu nguyen target answer do, chi thay doi ngu canh va cach hoi.\n");
        builder.append("UserId: ").append(user.getId()).append('\n');

        if (request.gradeId() != null) {
            builder.append("GradeId: ").append(request.gradeId()).append('\n');
        }

        if (request.unitNumber() != null) {
            builder.append("Unit number: ").append(request.unitNumber()).append('\n');
        }

        builder.append("So cau can tao: ")
                .append(requestedCount)
                .append(" (tu dong can doi theo so cau sai tham chieu: ")
                .append(wrongQuestions.size())
                .append(")\n");

        if (!allowedQuestionTypes.isEmpty()) {
            builder.append("Allowed personalized question types:\n");
            for (QuestionType questionType : allowedQuestionTypes) {
                builder.append("- ").append(questionType.name()).append('\n');
            }
            if (allowedQuestionTypes.size() > 1) {
                builder.append("Hay phan bo hon hop nhieu dang trong danh sach tren, khong don het ve mot dang.\n");
            }
        }

        if (!allowedTargetAnswers.isEmpty()) {
            builder.append("Allowed target answers:\n");
            for (String targetAnswer : allowedTargetAnswers) {
                builder.append("- ").append(targetAnswer).append('\n');
            }
            builder.append("Bat buoc dap an dung cua moi cau moi phai trung MOT TRONG cac target answer o tren.\n");
        }

        builder.append("Cac cau sai tham chieu:\n");
        for (Question question : wrongQuestions) {
            List<QuestionOption> options = questionOptionRepo.findByQuestionId(question.getId());
            String targetAnswer = resolveTargetAnswer(question, options);

            builder.append("- Reference question id: ").append(question.getId()).append('\n');
            builder.append("  type: ").append(question.getQuestionType()).append('\n');
            builder.append("  content: ").append(nullToEmpty(question.getContent())).append('\n');
            builder.append("  instruction: ").append(nullToEmpty(question.getInstruction())).append('\n');
            builder.append("  questionData: ").append(nullToEmpty(question.getQuestionData())).append('\n');
            builder.append("  explanation: ").append(nullToEmpty(question.getExplanation())).append('\n');
            builder.append("  rawCorrectAnswer: ").append(nullToEmpty(question.getCorrectAnswer())).append('\n');
            builder.append("  targetAnswer: ").append(targetAnswer).append('\n');

            if (!options.isEmpty()) {
                builder.append("  options:\n");
                for (QuestionOption option : options) {
                    builder.append("    - ")
                            .append(nullToEmpty(option.getOptionKey()))
                            .append(": ")
                            .append(nullToEmpty(option.getContent()));
                    if (option.isCorrect()) {
                        builder.append(" [CORRECT]");
                    }
                    builder.append('\n');
                }
            }

            builder.append("  requirement: Tao cau hoi moi van kiem tra dung targetAnswer neu targetAnswer khong rong.\n");
        }

        return builder.toString();
    }

    private String resolveTargetAnswer(Question question, List<QuestionOption> options) {
        if (options != null && !options.isEmpty()) {
            for (QuestionOption option : options) {
                if (option.isCorrect() && option.getContent() != null && !option.getContent().isBlank()) {
                    return option.getContent().trim();
                }
            }

            String normalizedCorrectAnswer = normalizeOptionKey(question.getCorrectAnswer());
            for (QuestionOption option : options) {
                if (normalizedCorrectAnswer.equalsIgnoreCase(nullToEmpty(option.getOptionKey()))
                        && option.getContent() != null
                        && !option.getContent().isBlank()) {
                    return option.getContent().trim();
                }
            }
        }

        return nullToEmpty(question.getCorrectAnswer());
    }

    private int normalizeCount(Integer questionCount, int wrongQuestionCount) {
        if (questionCount != null && questionCount > 0) {
            return Math.min(questionCount, MAX_QUESTION_COUNT);
        }

        int derivedCount = wrongQuestionCount * QUESTIONS_PER_WRONG_REFERENCE;
        return Math.min(
                TARGET_AUTO_QUESTION_COUNT,
                Math.max(MIN_AUTO_QUESTION_COUNT, derivedCount)
        );
    }

    private void ensureVip(User user) {
        if (user.getRole() == Role.ADMIN) {
            return;
        }

        if (user.getVipExpiredAt() == null || !user.getVipExpiredAt().isAfter(LocalDateTime.now())) {
            throw new AppException(ErrorCode.VIP_REQUIRED);
        }
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeComparableAnswer(String value) {
        if (value == null) {
            return "";
        }

        return value.trim()
                .replaceAll("[_-]+", " ")
                .replaceAll("\\s+", " ")
                .toLowerCase();
    }
}
