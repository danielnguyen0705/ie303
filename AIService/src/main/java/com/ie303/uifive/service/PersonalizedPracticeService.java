package com.ie303.uifive.service;

import com.ie303.uifive.client.ContentServiceClient;
import com.ie303.uifive.client.ProgressServiceClient;
import com.ie303.uifive.dto.req.PersonalizedQuestionRequest;
import com.ie303.uifive.dto.req.QuestionOptionRequest;
import com.ie303.uifive.dto.req.QuestionRequest;
import com.ie303.uifive.dto.res.QuestionOptionResponse;
import com.ie303.uifive.dto.res.QuestionResponse;
import com.ie303.uifive.entity.QuestionType;
import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private static final Set<QuestionType> SUPPORTED_PERSONALIZED_TYPES = Set.of(QuestionType.QUALITATIVE_MC);

    private final UserService userService;
    private final AiGenerationService aiGenerationService;
    private final ContentServiceClient contentServiceClient;
    private final ProgressServiceClient progressServiceClient;

    public List<QuestionResponse> generateFromWrongQuestions(PersonalizedQuestionRequest request) {
        User currentUser = userService.getCurrentUser();
        ensureVip(currentUser);

        List<QuestionResponse> wrongQuestions = resolveWrongQuestions(currentUser.getId(), request);
        List<QuestionResponse> supportedWrongQuestions = filterSupportedQuestions(wrongQuestions);

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

            validDrafts = filterValidPersonalizedDrafts(drafts, allowedTargetAnswers, allowedQuestionTypes);
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

        return validDrafts.stream()
                .map(draft -> persistGeneratedQuestion(draft, allowedQuestionTypes, null))
                .toList();
    }

    private List<QuestionResponse> resolveWrongQuestions(Long userId, PersonalizedQuestionRequest request) {
        if (request.gradeId() == null || request.unitNumber() == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "gradeId and unitNumber are required");
        }

        if (request.unitNumber() <= 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "unitNumber must be greater than 0");
        }

        List<Long> wrongQuestionIds = progressServiceClient.getMyQuestionHistories().stream()
                .filter(history -> !history.correct())
                .map(history -> history.questionId())
                .distinct()
                .toList();

        if (wrongQuestionIds.isEmpty()) {
            return List.of();
        }

        Map<Long, QuestionResponse> questionsById = wrongQuestionIds.stream()
                .map(contentServiceClient::getQuestion)
                .collect(Collectors.toMap(
                        QuestionResponse::id,
                        question -> question,
                        (left, right) -> left,
                        LinkedHashMap::new
                ));

        return wrongQuestionIds.stream()
                .map(questionsById::get)
                .filter(question -> question != null && isQuestionInRequestedScope(question, request.gradeId(), request.unitNumber()))
                .toList();
    }

    private boolean isQuestionInRequestedScope(QuestionResponse question, Long gradeId, Integer unitNumber) {
        Long lessonId = resolveLessonId(question);
        if (lessonId == null) {
            return false;
        }

        var lesson = contentServiceClient.getLesson(lessonId);
        if (lesson.sectionId() == null) {
            return false;
        }

        var section = contentServiceClient.getSection(lesson.sectionId());
        if (section.unitId() == null) {
            return false;
        }

        var unit = contentServiceClient.getUnit(section.unitId());
        return gradeId.equals(unit.gradeId()) && unitNumber.equals(unit.unitNumber());
    }

    private List<String> resolveAllowedTargetAnswers(List<QuestionResponse> wrongQuestions) {
        Set<String> answers = new LinkedHashSet<>();

        for (QuestionResponse question : wrongQuestions) {
            String targetAnswer = resolveTargetAnswer(question);
            if (targetAnswer != null && !targetAnswer.isBlank()) {
                answers.add(targetAnswer.trim());
            }
        }

        return new ArrayList<>(answers);
    }

    private List<QuestionType> resolveAllowedQuestionTypes(List<QuestionResponse> wrongQuestions) {
        Set<QuestionType> resolved = new LinkedHashSet<>();

        for (QuestionResponse question : wrongQuestions) {
            if (question.questionType() != null) {
                resolved.add(QuestionType.QUALITATIVE_MC);
            }
        }

        if (resolved.isEmpty()) {
            resolved.add(QuestionType.QUALITATIVE_MC);
        }

        return new ArrayList<>(resolved);
    }

    private List<QuestionResponse> filterSupportedQuestions(List<QuestionResponse> questions) {
        return questions.stream()
                .filter(question -> question.questionType() != null)
                .filter(question -> REUSABLE_SOURCE_TYPES.contains(question.questionType()))
                .filter(this::isQuestionReusableForPersonalizedSet)
                .toList();
    }

    private String buildContext(
            User user,
            PersonalizedQuestionRequest request,
            List<QuestionResponse> wrongQuestions,
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
            QuestionResponse question = wrongQuestions.get(i);

            builder.append("\n[MISTAKE #").append(i + 1).append("]\n");
            builder.append("Question ID: ").append(question.id()).append("\n");
            builder.append("Question Content: ").append(nullToEmpty(question.content())).append("\n");

            if (!nullToEmpty(question.instruction()).isBlank()) {
                builder.append("Instruction: ").append(question.instruction()).append("\n");
            }

            List<QuestionOptionResponse> options = safeOptions(question);
            if (!options.isEmpty()) {
                builder.append("Options:\n");
                for (QuestionOptionResponse option : options) {
                    builder.append("  ").append(nullToEmpty(option.optionKey())).append(". ").append(nullToEmpty(option.content()));
                    if (option.isCorrect()) {
                        builder.append(" [STUDENT GOT THIS WRONG]\n");
                    } else {
                        builder.append("\n");
                    }
                }
            }

            if (!nullToEmpty(question.explanation()).isBlank()) {
                builder.append("Explanation: ").append(question.explanation()).append("\n");
            }
            builder.append("Correct Answer should be: ").append(resolveTargetAnswer(question)).append("\n");
        }

        builder.append("\n");
        builder.append("=".repeat(80)).append("\n");
        builder.append("Allowed question types: ").append(allowedQuestionTypes).append("\n");
        builder.append("Return only valid JSON matching the expected schema.");

        return builder.toString();
    }

    private boolean isQuestionReusableForPersonalizedSet(QuestionResponse question) {
        if (isOptionBasedType(question.questionType())) {
            List<QuestionOptionResponse> options = safeOptions(question);
            if (!hasSupportedOptionCount(question.questionType(), options.size())) {
                return false;
            }

            long correctCount = options.stream().filter(QuestionOptionResponse::isCorrect).count();
            if (correctCount != 1) {
                return false;
            }
        }

        return hasReusablePrompt(question) || hasReusableAnswer(question);
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

        if (!isMeaningfulPrompt(draft.content())) {
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

            if (!hasMeaningfulOptions(options)) {
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

    private List<QuestionResponse> generateFallbackRetrySet(List<QuestionResponse> wrongQuestions, int count) {
        if (wrongQuestions.isEmpty()) {
            throw new AppException(
                    ErrorCode.NO_WRONG_QUESTIONS_FOUND,
                    "No wrong questions found. Please answer more questions incorrectly in this unit first"
            );
        }

        List<QuestionResponse> generatedQuestions = new ArrayList<>();

        for (int index = 0; index < count; index += 1) {
            QuestionResponse source = wrongQuestions.get(index % wrongQuestions.size());
            AiGenerationService.GeneratedPersonalizedQuestionDraft draft = new AiGenerationService.GeneratedPersonalizedQuestionDraft(
                    "QUALITATIVE_MC",
                    buildFallbackContent(source),
                    buildFallbackExplanation(source.explanation()),
                    source.correctAnswer(),
                    source.options() == null
                            ? List.of()
                            : source.options().stream()
                            .map(option -> new AiGenerationService.GeneratedMcqOptionDraft(option.optionKey(), option.content()))
                            .toList()
            );
            generatedQuestions.add(persistGeneratedQuestion(draft, List.of(QuestionType.QUALITATIVE_MC), source));
        }

        return generatedQuestions;
    }

    private QuestionResponse persistGeneratedQuestion(
            AiGenerationService.GeneratedPersonalizedQuestionDraft draft,
            List<QuestionType> allowedQuestionTypes,
            QuestionResponse fallbackSource
    ) {
        QuestionType questionType = normalizeGeneratedQuestionType(draft.questionType(), allowedQuestionTypes);
        String storedCorrectAnswer = resolveStoredCorrectAnswer(draft, questionType);

        QuestionRequest request = new QuestionRequest(
                questionType,
                draft.content(),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                draft.explanation(),
                storedCorrectAnswer,
                null,
                null
        );

        QuestionResponse created = contentServiceClient.createQuestion(request);
        if (isOptionBasedType(questionType)) {
            List<AiGenerationService.GeneratedMcqOptionDraft> options = draft.options() == null
                    ? List.of()
                    : draft.options();
            String correctKey = resolveCorrectOptionKey(draft);

            for (AiGenerationService.GeneratedMcqOptionDraft draftOption : options) {
                if (draftOption == null || draftOption.content() == null || draftOption.content().isBlank()) {
                    continue;
                }

                String optionKey = normalizeOptionKey(draftOption.optionKey());
                contentServiceClient.createQuestionOption(new QuestionOptionRequest(
                        optionKey,
                        draftOption.content().trim(),
                        optionKey.equals(correctKey),
                        created.id()
                ));
            }
        }

        return contentServiceClient.getQuestion(created.id());
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

    private boolean hasReusablePrompt(QuestionResponse question) {
        return isMeaningfulPrompt(question.content())
                || isMeaningfulPrompt(question.instruction())
                || !nullToEmpty(question.explanation()).isBlank();
    }

    private boolean hasReusableAnswer(QuestionResponse question) {
        String targetAnswer = resolveTargetAnswer(question);
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

    private String buildFallbackContent(QuestionResponse source) {
        String content = nullToEmpty(source.content()).trim();
        if (isMeaningfulPrompt(content) && !hasDetachedBlankPrompt(content)) {
            return content;
        }

        String instruction = nullToEmpty(source.instruction()).trim();
        if (isMeaningfulPrompt(instruction)) {
            return instruction;
        }

        String explanation = nullToEmpty(source.explanation()).trim();
        if (isMeaningfulPrompt(explanation)) {
            return "Choose the best answer based on this clue: " + explanation;
        }

        if (!hasDetachedBlankPrompt(content)) {
            return content;
        }
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

    private Long resolveLessonId(QuestionResponse question) {
        if (question.lessonId() != null) {
            return question.lessonId();
        }

        if (question.questionGroupId() != null) {
            var group = contentServiceClient.getQuestionGroup(question.questionGroupId());
            return group.lessonId();
        }

        return null;
    }

    private List<QuestionOptionResponse> safeOptions(QuestionResponse question) {
        return question.options() == null ? List.of() : question.options();
    }

    private boolean hasMeaningfulOptions(List<AiGenerationService.GeneratedMcqOptionDraft> options) {
        return options.stream().anyMatch(option -> option != null
                && option.content() != null
                && !option.content().isBlank());
    }

    private boolean isMeaningfulPrompt(String value) {
        return value != null && !value.trim().isBlank();
    }

    private String resolveTargetAnswer(QuestionResponse question) {
        if (!isOptionBasedType(question.questionType())) {
            return nullToEmpty(question.correctAnswer());
        }

        for (QuestionOptionResponse option : safeOptions(question)) {
            if (option.isCorrect()) {
                return option.content();
            }
        }

        return question.correctAnswer();
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private String normalizeComparableAnswer(String value) {
        if (value == null) {
            return "";
        }

        return value.toLowerCase()
                .replaceAll("[\\p{Punct}]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private int normalizeCount(Integer requestedCount, int sourceCount) {
        if (requestedCount == null || requestedCount <= 0) {
            return Math.min(TARGET_AUTO_QUESTION_COUNT, Math.max(MIN_AUTO_QUESTION_COUNT, sourceCount * QUESTIONS_PER_WRONG_REFERENCE));
        }

        return Math.max(1, Math.min(MAX_QUESTION_COUNT, requestedCount));
    }

    private void ensureVip(User user) {
        if (user.getVipExpiredAt() == null || !user.getVipExpiredAt().isAfter(java.time.LocalDateTime.now())) {
            throw new AppException(
                    ErrorCode.VIP_REQUIRED,
                    "This personalized question feature requires an active VIP subscription. Please upgrade your account to access this feature."
            );
        }
    }
}
