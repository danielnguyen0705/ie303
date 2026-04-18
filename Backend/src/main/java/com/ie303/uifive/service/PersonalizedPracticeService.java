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
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PersonalizedPracticeService {

    private static final int DEFAULT_QUESTION_COUNT = 5;
    private static final int MAX_QUESTION_COUNT = 10;

    private final UserService userService;
    private final UserQuestionHistoryRepo userQuestionHistoryRepo;
    private final GeminiService geminiService;
    private final QuestionRepo questionRepo;
    private final QuestionOptionRepo questionOptionRepo;
    private final QuestionMapper questionMapper;

    public List<QuestionResponse> generateFromWrongQuestions(PersonalizedQuestionRequest request) {
        User currentUser = userService.getCurrentUser();
        ensureVip(currentUser);

        int count = normalizeCount(request.questionCount());
        List<Question> wrongQuestions = resolveWrongQuestions(currentUser.getId(), request);

        if (wrongQuestions.isEmpty()) {
            throw new AppException(ErrorCode.NO_WRONG_QUESTIONS_FOUND);
        }

        String context = buildContext(currentUser, request, wrongQuestions);
        String topic = request.topic();

        List<GeminiService.GeneratedMcqDraft> drafts = geminiService.generateMcqQuestions(
                context,
                count,
                topic
        );

        List<Question> generatedQuestions = drafts.stream()
                .map(draft -> {
                    Question question = new Question();
                    question.setQuestionType(QuestionType.QUALITATIVE_MC);
                    question.setContent(draft.content());
                    question.setExplanation(draft.explanation());
                    question.setCorrectAnswer(normalizeOptionKey(draft.correctOptionKey()));
                    return question;
                })
                .toList();

        List<Question> savedQuestions = questionRepo.saveAll(generatedQuestions);

        List<QuestionOption> optionsToSave = new ArrayList<>();
        for (int i = 0; i < savedQuestions.size(); i++) {
            Question savedQuestion = savedQuestions.get(i);
            GeminiService.GeneratedMcqDraft draft = drafts.get(i);

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

    private List<QuestionOption> buildOptions(Question question, GeminiService.GeneratedMcqDraft draft) {
        List<GeminiService.GeneratedMcqOptionDraft> draftOptions = draft.options() == null
                ? List.of()
                : draft.options();

        List<QuestionOption> options = new ArrayList<>();
        String correctKey = normalizeOptionKey(draft.correctOptionKey());

        for (GeminiService.GeneratedMcqOptionDraft draftOption : draftOptions) {
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
        List<Long> wrongQuestionIds;

        if (request.gradeId() != null && request.startUnit() != null && request.endUnit() != null) {
            if (request.startUnit() > request.endUnit()) {
                throw new AppException(ErrorCode.INVALID_REQUEST, "startUnit must be <= endUnit");
            }

            wrongQuestionIds = userQuestionHistoryRepo.findDistinctWrongQuestionIdsByUserAndGradeAndUnitRange(
                    userId,
                    request.gradeId(),
                    request.startUnit(),
                    request.endUnit()
            );
        } else {
            wrongQuestionIds = userQuestionHistoryRepo.findDistinctWrongQuestionIdsByUser(userId);
        }

        if (wrongQuestionIds == null || wrongQuestionIds.isEmpty()) {
            return List.of();
        }

        return questionRepo.findAllById(wrongQuestionIds);
    }

    private String buildContext(User user, PersonalizedQuestionRequest request, List<Question> wrongQuestions) {
        StringBuilder builder = new StringBuilder();
        builder.append("Tao bo cau hoi ca nhan hoa cho hoc sinh dua tren cac cau lam sai.\n");
        builder.append("UserId: ").append(user.getId()).append('\n');

        if (request.gradeId() != null) {
            builder.append("GradeId: ").append(request.gradeId()).append('\n');
        }

        if (request.startUnit() != null && request.endUnit() != null) {
            builder.append("Unit range: ").append(request.startUnit()).append(" - ").append(request.endUnit()).append('\n');
        }

        builder.append("Cac cau sai tham chieu:\n");
        for (Question question : wrongQuestions) {
            builder.append("- [")
                    .append(question.getQuestionType())
                    .append("] ")
                    .append(nullToEmpty(question.getContent()))
                    .append(" | explanation: ")
                    .append(nullToEmpty(question.getExplanation()))
                    .append(" | correctAnswer: ")
                    .append(nullToEmpty(question.getCorrectAnswer()))
                    .append('\n');
        }

        return builder.toString();
    }

    private int normalizeCount(Integer questionCount) {
        if (questionCount == null || questionCount <= 0) {
            return DEFAULT_QUESTION_COUNT;
        }

        return Math.min(questionCount, MAX_QUESTION_COUNT);
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
}
