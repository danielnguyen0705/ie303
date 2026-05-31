package com.ie303.uifive.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ie303.uifive.dto.req.PersonalizedQuestionRequest;
import com.ie303.uifive.dto.res.QuestionOptionResponse;
import com.ie303.uifive.dto.res.QuestionResponse;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.entity.QuestionOption;
import com.ie303.uifive.entity.QuestionType;
import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.repo.QuestionOptionRepo;
import com.ie303.uifive.repo.QuestionRepo;
import com.ie303.uifive.repo.UserQuestionHistoryRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PersonalizedPracticeService {

    private static final int MIN_AUTO_QUESTION_COUNT = 10;
    private static final int TARGET_AUTO_QUESTION_COUNT = 20;
    private static final int QUESTIONS_PER_WRONG_REFERENCE = 4;
    private static final int MAX_QUESTION_COUNT = 15;
    private static final Set<QuestionType> REUSABLE_SOURCE_TYPES = Set.copyOf(Arrays.asList(QuestionType.values()));
    private static final Set<QuestionType> SUPPORTED_PERSONALIZED_TYPES = Set.of(
            QuestionType.QUALITATIVE_MC
    );

    private final UserService userService;
    private final UserQuestionHistoryRepo userQuestionHistoryRepo;
    private final AiGenerationService aiGenerationService;
    private final QuestionRepo questionRepo;
    private final QuestionOptionRepo questionOptionRepo;
    private final ObjectMapper objectMapper;

    public List<QuestionResponse> generateFromWrongQuestions(PersonalizedQuestionRequest request) {
        User currentUser = userService.getCurrentUser();
        ensureVip(currentUser);

        List<Question> wrongQuestions = resolveWrongQuestions(currentUser.getId(), request);
        List<Question> supportedWrongQuestions = filterSupportedQuestions(wrongQuestions);

        if (supportedWrongQuestions.isEmpty()) {
            throw new AppException(
                    ErrorCode.NO_WRONG_QUESTIONS_FOUND,
                    "No reusable multiple-choice wrong questions found for this unit"
            );
        }

        int count = normalizeCount(request.questionCount(), supportedWrongQuestions.size());
        List<String> allowedTargetAnswers = resolveAllowedTargetAnswers(supportedWrongQuestions);
        List<QuestionType> allowedQuestionTypes = resolveAllowedQuestionTypes(supportedWrongQuestions);
        String context = buildContext(currentUser, request, supportedWrongQuestions, allowedTargetAnswers, allowedQuestionTypes, count);

        List<AiGenerationService.GeneratedPersonalizedQuestionDraft> validDrafts;
        try {
            List<AiGenerationService.GeneratedPersonalizedQuestionDraft> drafts = aiGenerationService.generatePersonalizedQuestions(
                    context,
                    count,
                    null
            );

            validDrafts = filterValidPersonalizedDrafts(
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
        } catch (AppException exception) {
            if (!shouldFallbackToRetrySet(exception)) {
                throw exception;
            }

            log.warn("Falling back to retry-set personalized questions: {}", exception.getMessage());
            return generateFallbackRetrySet(supportedWrongQuestions, count);
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
                .map(this::toResponse)
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

            resolved.add(QuestionType.QUALITATIVE_MC);
        }

        if (resolved.isEmpty()) {
            resolved.add(QuestionType.QUALITATIVE_MC);
        }

        return new ArrayList<>(resolved);
    }

    private List<Question> filterSupportedQuestions(List<Question> questions) {
        return questions.stream()
                .filter(question -> question.getQuestionType() != null)
                .filter(question -> REUSABLE_SOURCE_TYPES.contains(question.getQuestionType()))
                .filter(this::isQuestionReusableForPersonalizedSet)
                .toList();
    }

    private boolean isQuestionReusableForPersonalizedSet(Question question) {
        List<QuestionOption> options = questionOptionRepo.findByQuestionId(question.getId());
        if (isOptionBasedType(question.getQuestionType())) {
            if (!hasSupportedOptionCount(question.getQuestionType(), options.size())) {
                return false;
            }

            long correctCount = options.stream().filter(QuestionOption::isCorrect).count();
            if (correctCount != 1) {
                return false;
            }
        }

        return hasReusablePrompt(question) || hasReusableAnswer(question, options);
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

        if (hasDetachedBlankPrompt(draft.content())) {
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
        String storedCorrectAnswer = resolveStoredCorrectAnswer(draft, question.getQuestionType());

        for (AiGenerationService.GeneratedMcqOptionDraft draftOption : draftOptions) {
            if (draftOption == null || draftOption.content() == null || draftOption.content().isBlank()) {
                continue;
            }

            QuestionOption option = new QuestionOption();
            String optionKey = normalizeOptionKey(draftOption.optionKey());
            boolean isCorrect = optionKey.equals(correctKey);

            option.setQuestion(question);
            option.setOptionKey(optionKey);
            option.setContent(draftOption.content().trim());
            option.setCorrect(isCorrect);
            options.add(option);
        }

        return options;
    }

    private List<QuestionResponse> generateFallbackRetrySet(List<Question> wrongQuestions, int count) {
        if (wrongQuestions.isEmpty()) {
            throw new AppException(
                    ErrorCode.NO_WRONG_QUESTIONS_FOUND,
                    "No wrong questions found. Please answer more questions incorrectly in this unit first"
            );
        }

        Map<Long, List<QuestionOption>> optionsByQuestionId = wrongQuestions.stream()
                .collect(Collectors.toMap(
                        Question::getId,
                        question -> questionOptionRepo.findByQuestionId(question.getId()),
                        (left, right) -> left,
                        LinkedHashMap::new
                ));

        List<Question> generatedQuestions = new ArrayList<>();
        List<List<QuestionOption>> generatedOptions = new ArrayList<>();

        for (int index = 0; index < count; index += 1) {
            Question source = wrongQuestions.get(index % wrongQuestions.size());
            List<QuestionOption> sourceOptions = optionsByQuestionId.getOrDefault(source.getId(), List.of());

            Question generated = new Question();
            generated.setQuestionType(QuestionType.QUALITATIVE_MC);
            generated.setContent(buildFallbackContent(source));
            generated.setInstruction(source.getInstruction());
            generated.setHint(source.getHint());
            generated.setQuestionData(source.getQuestionData());
            generated.setCorrectAnswer(source.getCorrectAnswer());
            generated.setExplanation(buildFallbackExplanation(source.getExplanation()));
            generatedQuestions.add(generated);

            List<QuestionOption> clonedOptions = sourceOptions.stream()
                    .map(option -> {
                        QuestionOption clone = new QuestionOption();
                        clone.setOptionKey(option.getOptionKey());
                        clone.setContent(option.getContent());
                        clone.setCorrect(option.isCorrect());
                        return clone;
                    })
                    .toList();
            generatedOptions.add(clonedOptions);
        }

        List<Question> savedQuestions = questionRepo.saveAll(generatedQuestions);
        List<QuestionOption> optionsToSave = new ArrayList<>();

        for (int index = 0; index < savedQuestions.size(); index += 1) {
            Question savedQuestion = savedQuestions.get(index);
            List<QuestionOption> clonedOptions = generatedOptions.get(index);

            for (QuestionOption option : clonedOptions) {
                option.setQuestion(savedQuestion);
            }

            savedQuestion.setOptions(clonedOptions);
            optionsToSave.addAll(clonedOptions);
        }

        if (!optionsToSave.isEmpty()) {
            questionOptionRepo.saveAll(optionsToSave);
        }

        return savedQuestions.stream()
                .map(this::toResponse)
                .toList();
    }

    private String buildFallbackExplanation(String originalExplanation) {
        String base = nullToEmpty(originalExplanation);
        if (base.isBlank()) {
            return "Retry practice set generated from your wrong-answer history because the AI provider is temporarily unavailable.";
        }

        return base + "\n\nRetry practice set generated from your wrong-answer history because the AI provider is temporarily unavailable.";
    }

    private boolean shouldFallbackToRetrySet(AppException exception) {
        ErrorCode errorCode = exception.getErrorCode();
        return errorCode == ErrorCode.AI_NOT_RESPONSE
                || errorCode == ErrorCode.AI_INVALID_RESPONSE
                || errorCode == ErrorCode.AI_NOT_CONFIGURED;
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
                || questionType == QuestionType.CLOZE_MC
                || questionType == QuestionType.TRUE_FALSE_NG;
    }

    private boolean hasSupportedOptionCount(QuestionType questionType, int optionCount) {
        if (questionType == QuestionType.TRUE_FALSE_NG) {
            return optionCount == 3;
        }

        return optionCount == 4;
    }

    private boolean hasReusablePrompt(Question question) {
        return !nullToEmpty(question.getContent()).isBlank()
                || !nullToEmpty(question.getInstruction()).isBlank()
                || !nullToEmpty(question.getExplanation()).isBlank();
    }

    private boolean hasReusableAnswer(Question question, List<QuestionOption> options) {
        String targetAnswer = resolveTargetAnswer(question, options);
        return targetAnswer != null && !targetAnswer.isBlank();
    }

    private boolean hasDetachedBlankPrompt(String content) {
        String normalized = normalizeComparableAnswer(content);
        return normalized.matches(".*\\bblank\\s+\\d+\\b.*")
                || (normalized.matches(".*\\bblank\\b.*")
                && !content.contains("____")
                && !content.contains("___")
                && !content.contains("..."));
    }

    private String buildFallbackContent(Question source) {
        String content = nullToEmpty(source.getContent()).trim();
        if (!hasDetachedBlankPrompt(content)) {
            return content;
        }

        String explanation = nullToEmpty(source.getExplanation()).trim();
        if (!explanation.isBlank()) {
            return "Choose the best answer based on this clue: " + explanation;
        }

        return "Choose the best answer.";
    }

    private String resolveStoredCorrectAnswer(
            AiGenerationService.GeneratedPersonalizedQuestionDraft draft,
            QuestionType questionType
    ) {
        if (!isOptionBasedType(questionType)) {
            return nullToEmpty(draft.correctAnswer());
        }

        String content = resolveCorrectOptionContent(draft);
        if (!content.isBlank()) {
            return content;
        }

        return normalizeOptionKey(draft.correctAnswer());
    }

    private String resolveCorrectOptionKey(AiGenerationService.GeneratedPersonalizedQuestionDraft draft) {
        String normalizedCorrectAnswer = normalizeComparableAnswer(draft.correctAnswer());

        if (draft.options() != null) {
            for (AiGenerationService.GeneratedMcqOptionDraft option : draft.options()) {
                if (option == null) {
                    continue;
                }

                String optionKey = normalizeOptionKey(option.optionKey());
                String normalizedKey = normalizeComparableAnswer(optionKey);
                String normalizedContent = normalizeComparableAnswer(option.content());

                if (normalizedCorrectAnswer.equals(normalizedKey)) {
                    return optionKey;
                }

                if (option.content() != null && normalizedCorrectAnswer.equals(normalizedContent)) {
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
        builder.append("OBJECTIVE: Create personalized English practice questions based on the student's mistakes.\n");
        builder.append("FOCUS: The student got these questions WRONG. Create new questions that practice the SAME grammar/vocabulary/structure patterns.\n");
        builder.append("PRESERVE ANSWERS: If the student's correct answers are listed below (allowedTargetAnswers), the new questions MUST have those same correct answers.\n");
        builder.append("NO PLACEHOLDER QUESTIONS: Each question must have a COMPLETE English sentence or context - not just 'Choose the best answer.'\n");
        builder.append("QUESTION FORMAT: Simple multiple-choice with 4 options (A/B/C/D).\n\n");

        builder.append("Student ID: ").append(user.getId()).append("\n");
        if (request.gradeId() != null) {
            builder.append("Grade ID: ").append(request.gradeId()).append("\n");
        }
        if (request.unitNumber() != null) {
            builder.append("Unit Number: ").append(request.unitNumber()).append("\n");
        }
        builder.append("Number of questions to create: ").append(requestedCount).append("\n\n");

        if (!allowedTargetAnswers.isEmpty()) {
            builder.append("IMPORTANT - Correct Answer Constraints:\n");
            builder.append("The new questions MUST have one of these correct answers:\n");
            for (String targetAnswer : allowedTargetAnswers) {
                builder.append("  - ").append(targetAnswer).append("\n");
            }
            builder.append("\n");
        }

        builder.append("STUDENT'S WRONG QUESTIONS (learn from these patterns):\n");
        builder.append("=".repeat(80)).append("\n");

        for (int i = 0; i < wrongQuestions.size(); i++) {
            Question question = wrongQuestions.get(i);
            List<QuestionOption> options = questionOptionRepo.findByQuestionId(question.getId());
            String targetAnswer = resolveTargetAnswer(question, options);

            builder.append("\n[MISTAKE #").append(i + 1).append("]\n");
            builder.append("Question ID: ").append(question.getId()).append("\n");
            builder.append("Question Content: ").append(nullToEmpty(question.getContent())).append("\n");

            if (!nullToEmpty(question.getInstruction()).isBlank()) {
                builder.append("Instruction: ").append(question.getInstruction()).append("\n");
            }

            if (!options.isEmpty()) {
                builder.append("Options:\n");
                for (QuestionOption option : options) {
                    String optionKey = nullToEmpty(option.getOptionKey());
                    String optionContent = nullToEmpty(option.getContent());
                    builder.append("  ").append(optionKey).append(". ").append(optionContent);
                    if (option.isCorrect()) {
                        builder.append(" [STUDENT GOT THIS WRONG]\n");
                    } else {
                        builder.append("\n");
                    }
                }
            }

            if (!nullToEmpty(question.getExplanation()).isBlank()) {
                builder.append("Explanation: ").append(question.getExplanation()).append("\n");
            }
            builder.append("Correct Answer should be: ").append(targetAnswer).append("\n");
        }

        builder.append("\n");
        builder.append("=".repeat(80)).append("\n");
        builder.append("CREATE NEW QUESTIONS that test the SAME PATTERNS. Make sure each new question has:\n");
        builder.append("  1. A complete English sentence or paragraph as the question\n");
        builder.append("  2. A clear blank or choice point\n");
        builder.append("  3. Four distinct options\n");
        builder.append("  4. One obviously correct answer\n");

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
            throw new AppException(
                    ErrorCode.VIP_REQUIRED,
                    "This personalized question feature requires an active VIP subscription. Please upgrade your account to access this feature."
            );
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

    private QuestionResponse toResponse(Question question) {
        return new QuestionResponse(
                question.getId(),
                question.getQuestionType(),
                question.getContent(),
                question.getInstruction(),
                question.getHint(),
                question.getAudioUrl(),
                question.getImageUrl(),
                question.getQuestionData(),
                question.getExplanation(),
                question.getCorrectAnswer(),
                question.getLesson() == null ? null : question.getLesson().getId(),
                question.getQuestionGroup() == null ? null : question.getQuestionGroup().getId(),
                question.getOptions() == null ? List.of() : question.getOptions().stream().map(this::toResponse).toList()
        );
    }

    private QuestionOptionResponse toResponse(QuestionOption option) {
        return new QuestionOptionResponse(
                option.getId(),
                option.getOptionKey(),
                option.getContent(),
                option.isCorrect()
        );
    }
}
