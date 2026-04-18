package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.SemesterTestRequest;
import com.ie303.uifive.dto.res.SemesterTestResponse;
import com.ie303.uifive.entity.Grade;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.entity.QuestionGroup;
import com.ie303.uifive.entity.QuestionOption;
import com.ie303.uifive.entity.QuestionType;
import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.SemesterTest;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.mapper.SemesterTestMapper;
import com.ie303.uifive.repo.GradeRepo;
import com.ie303.uifive.repo.LessonRepo;
import com.ie303.uifive.repo.QuestionGroupRepo;
import com.ie303.uifive.repo.QuestionOptionRepo;
import com.ie303.uifive.repo.QuestionRepo;
import com.ie303.uifive.repo.SemesterTestRepo;
import com.ie303.uifive.repo.UserQuestionHistoryRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class SemesterTestService {

    private final SemesterTestRepo repo;
    private final GradeRepo gradeRepo;
    private final QuestionRepo questionRepo;
    private final QuestionGroupRepo questionGroupRepo;
    private final SemesterTestMapper mapper;
    private final UserService userService;
    private final UserQuestionHistoryRepo userQuestionHistoryRepo;
    private final LessonRepo lessonRepo;
    private final QuestionOptionRepo questionOptionRepo;
    private final GeminiService geminiService;

    public SemesterTestResponse create(SemesterTestRequest request) {
        User currentUser = userService.getCurrentUser();
        ensureVip(currentUser);

        if (request.startUnit() > request.endUnit()) {
            throw new RuntimeException("startUnit phải nhỏ hơn hoặc bằng endUnit");
        }

        validateAiQuestionParams(request.aiQuestionCount(), request.gradeId());

        SemesterTest entity = mapper.toEntity(request);

        if (request.gradeId() != null) {
            Grade grade = gradeRepo.findById(request.gradeId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Grade với id = " + request.gradeId()));
            entity.setGrade(grade);
        }

        Set<Long> mergedQuestionIds = new LinkedHashSet<>();

        if (request.questionIds() != null) {
            mergedQuestionIds.addAll(request.questionIds());
        }

        if (Boolean.TRUE.equals(request.includeWrongQuestions()) && request.gradeId() != null) {
            List<Long> wrongQuestionIds = userQuestionHistoryRepo
                    .findDistinctWrongQuestionIdsByUserAndGradeAndUnitRange(
                            currentUser.getId(),
                            request.gradeId(),
                            request.startUnit(),
                            request.endUnit()
                    );
            mergedQuestionIds.addAll(wrongQuestionIds);
        }

        if (!mergedQuestionIds.isEmpty()) {
            List<Question> questions = questionRepo.findAllById(mergedQuestionIds);
            entity.setQuestions(questions);
        }

        if (request.aiQuestionCount() != null && request.aiQuestionCount() > 0) {
            List<Question> aiQuestions = createAiQuestionsForRange(
                request.gradeId(),
                request.startUnit(),
                request.endUnit(),
                request.aiQuestionCount(),
                request.aiQuestionTopic(),
                "Semester test: " + request.title()
            );

            List<Question> existingQuestions = entity.getQuestions() == null
                ? new java.util.ArrayList<>()
                : new java.util.ArrayList<>(entity.getQuestions());

            existingQuestions.addAll(aiQuestions);
            entity.setQuestions(existingQuestions);
        }

        if (request.questionGroupIds() != null) {
            List<QuestionGroup> questionGroups = questionGroupRepo.findAllById(request.questionGroupIds());
            entity.setQuestionGroups(questionGroups);
        }

        entity = repo.save(entity);

        SemesterTestResponse response = mapper.toResponse(entity);
        return response;
    }

    public SemesterTestResponse getById(Long id) {
        ensureVip(userService.getCurrentUser());

        SemesterTest entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy SemesterTest với id = " + id));

        SemesterTestResponse response = mapper.toResponse(entity);
        return response;
    }

    public List<SemesterTestResponse> getAll() {
        ensureVip(userService.getCurrentUser());

        List<SemesterTest> entities = repo.findAll();

        List<SemesterTestResponse> responses = entities.stream()
                .map(mapper::toResponse)
                .toList();

        return responses;
    }

    public SemesterTestResponse update(Long id, SemesterTestRequest request) {
        User currentUser = userService.getCurrentUser();
        ensureVip(currentUser);

        if (request.startUnit() > request.endUnit()) {
            throw new RuntimeException("startUnit phải nhỏ hơn hoặc bằng endUnit");
        }

        validateAiQuestionParams(request.aiQuestionCount(), request.gradeId());

        SemesterTest entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy SemesterTest với id = " + id));

        mapper.updateEntityFromRequest(request, entity);

        if (request.gradeId() != null) {
            Grade grade = gradeRepo.findById(request.gradeId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Grade với id = " + request.gradeId()));
            entity.setGrade(grade);
        } else {
            entity.setGrade(null);
        }

        Set<Long> mergedQuestionIds = new LinkedHashSet<>();

        if (request.questionIds() != null) {
            mergedQuestionIds.addAll(request.questionIds());
        }

        if (Boolean.TRUE.equals(request.includeWrongQuestions()) && request.gradeId() != null) {
            List<Long> wrongQuestionIds = userQuestionHistoryRepo
                    .findDistinctWrongQuestionIdsByUserAndGradeAndUnitRange(
                            currentUser.getId(),
                            request.gradeId(),
                            request.startUnit(),
                            request.endUnit()
                    );
            mergedQuestionIds.addAll(wrongQuestionIds);
        }

        if (!mergedQuestionIds.isEmpty()) {
            List<Question> questions = questionRepo.findAllById(mergedQuestionIds);
            entity.setQuestions(questions);
        } else {
            entity.setQuestions(null);
        }

        if (request.aiQuestionCount() != null && request.aiQuestionCount() > 0) {
            List<Question> aiQuestions = createAiQuestionsForRange(
                    request.gradeId(),
                    request.startUnit(),
                    request.endUnit(),
                    request.aiQuestionCount(),
                    request.aiQuestionTopic(),
                    "Semester test: " + request.title()
            );

            List<Question> existingQuestions = entity.getQuestions() == null
                    ? new java.util.ArrayList<>()
                    : new java.util.ArrayList<>(entity.getQuestions());

            existingQuestions.addAll(aiQuestions);
            entity.setQuestions(existingQuestions);
        }

        if (request.questionGroupIds() != null) {
            List<QuestionGroup> questionGroups = questionGroupRepo.findAllById(request.questionGroupIds());
            entity.setQuestionGroups(questionGroups);
        } else {
            entity.setQuestionGroups(null);
        }

        entity = repo.save(entity);

        SemesterTestResponse response = mapper.toResponse(entity);
        return response;
    }

    public void delete(Long id) {
        ensureVip(userService.getCurrentUser());

        if (!repo.existsById(id)) {
            throw new RuntimeException("Không tìm thấy SemesterTest với id = " + id);
        }

        repo.deleteById(id);
    }

    private void ensureVip(User user) {
        if (user.getRole() == Role.ADMIN) {
            return;
        }

        if (user.getVipExpiredAt() == null || !user.getVipExpiredAt().isAfter(LocalDateTime.now())) {
            throw new AppException(ErrorCode.VIP_REQUIRED);
        }
    }

    private void validateAiQuestionParams(Integer aiQuestionCount, Long gradeId) {
        if (aiQuestionCount == null || aiQuestionCount <= 0) {
            return;
        }

        if (gradeId == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "gradeId is required when aiQuestionCount > 0");
        }
    }

    private List<Question> createAiQuestionsForRange(Long gradeId,
                                                     int startUnit,
                                                     int endUnit,
                                                     int aiQuestionCount,
                                                     String topic,
                                                     String contextPrefix) {
        List<com.ie303.uifive.entity.Lesson> lessons = lessonRepo
                .findAllByGradeIdAndUnitNumberBetweenOrder(gradeId, startUnit, endUnit);

        if (lessons.isEmpty()) {
            throw new AppException(ErrorCode.LESSON_NOT_FOUND);
        }

        com.ie303.uifive.entity.Lesson targetLesson = lessons.get(0);
        String context = "%s | gradeId=%d | units=%d-%d".formatted(contextPrefix, gradeId, startUnit, endUnit);

        List<GeminiService.GeneratedMcqDraft> drafts = geminiService
                .generateMcqQuestions(context, aiQuestionCount, topic);

        List<Question> questions = drafts.stream()
                .map(draft -> {
                    Question q = new Question();
                    q.setQuestionType(QuestionType.QUALITATIVE_MC);
                    q.setContent(draft.content());
                    q.setExplanation(draft.explanation());
                    q.setCorrectAnswer(normalizeOptionKey(draft.correctOptionKey()));
                    q.setLesson(targetLesson);
                    return q;
                })
                .toList();

        List<Question> savedQuestions = questionRepo.saveAll(questions);

        List<QuestionOption> optionsToSave = new java.util.ArrayList<>();
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

        return savedQuestions;
    }

    private List<QuestionOption> buildOptions(Question question, GeminiService.GeneratedMcqDraft draft) {
        List<GeminiService.GeneratedMcqOptionDraft> draftOptions = draft.options() == null
                ? List.of()
                : draft.options();

        List<QuestionOption> options = new java.util.ArrayList<>();
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
}