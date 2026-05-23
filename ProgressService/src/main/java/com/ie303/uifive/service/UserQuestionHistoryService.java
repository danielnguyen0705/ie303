package com.ie303.uifive.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ie303.uifive.dto.req.UserLessonProgressRequest;
import com.ie303.uifive.dto.req.UserQuestionHistoryRequest;
import com.ie303.uifive.dto.res.UserQuestionHistoryResponse;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.entity.QuestionType;
import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.entity.UserQuestionHistory;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.repo.QuestionOptionRepo;
import com.ie303.uifive.repo.QuestionRepo;
import com.ie303.uifive.repo.UserQuestionHistoryRepo;
import com.ie303.uifive.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserQuestionHistoryService {

    private static final int QUESTION_CORRECT_COIN_REWARD = 1;
    private static final int QUESTION_CORRECT_SCORE_REWARD = 1;
    private static final int QUESTION_CORRECT_BASE_EXP_REWARD = 10;
    private static final double SPEAKING_PASS_SIMILARITY = 0.8;

    private final UserQuestionHistoryRepo repo;
    private final UserRepo userRepo;
    private final QuestionRepo questionRepo;
    private final QuestionOptionRepo questionOptionRepo;
    private final LearningProgressService learningProgressService;
    private final UserService userService;
    private final ObjectMapper objectMapper;

    @Transactional
    public UserQuestionHistoryResponse submit(UserQuestionHistoryRequest request) {
        User currentUser = userService.getCurrentUser();

        User user = userRepo.findById(currentUser.getId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        userService.touchStudyStreak(user.getId());
        user = userRepo.findById(currentUser.getId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        User historyUser = user;

        Question question = questionRepo.findById(request.questionId())
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));

        UserQuestionHistory history = repo.findByUserIdAndQuestionId(historyUser.getId(), request.questionId())
                .orElseGet(() -> {
                    UserQuestionHistory entity = new UserQuestionHistory();
                    entity.setUser(historyUser);
                    entity.setQuestion(question);
                    return entity;
                });

        boolean previouslyCorrect = history.isCorrect();
        boolean currentlyCorrect = isCorrectAnswer(question, request.answerText());

        history.setAnswerText(request.answerText());
        history.setUser(historyUser);
        history.setQuestion(question);
        history.setCorrect(currentlyCorrect);

        if (!previouslyCorrect && history.isCorrect()) {
            user.setCoin(user.getCoin() + QUESTION_CORRECT_COIN_REWARD);
            user.setScore(user.getScore() + QUESTION_CORRECT_SCORE_REWARD);
            int expEarned = calculateExpReward(user);
            user.setExp(user.getExp() + expEarned);
            userRepo.save(user);
        }

        history = repo.save(history);

        Long lessonId = resolveLessonId(question);
        if (lessonId != null) {
            maybeCompleteLesson(user, lessonId);
        }

        return toResponse(history);
    }

    public UserQuestionHistoryResponse getById(Long id) {
        UserQuestionHistory entity = repo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST, "User question history not found"));

        User currentUser = userService.getCurrentUser();
        if (currentUser.getRole() != Role.ADMIN && !entity.getUser().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        return toResponse(entity);
    }

    public List<UserQuestionHistoryResponse> getAll() {
        return repo.findAll().stream().map(this::toResponse).toList();
    }

    public List<UserQuestionHistoryResponse> getByUserId(Long userId) {
        return repo.findByUserId(userId).stream().map(this::toResponse).toList();
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new AppException(ErrorCode.QUESTION_NOT_FOUND);
        }

        repo.deleteById(id);
    }

    private UserQuestionHistoryResponse toResponse(UserQuestionHistory entity) {
        return new UserQuestionHistoryResponse(
                entity.getId(),
                entity.getAnswerText(),
                entity.isCorrect(),
                entity.getAnsweredAt(),
                entity.getUser() == null ? null : entity.getUser().getId(),
                entity.getQuestion() == null ? null : entity.getQuestion().getId()
        );
    }

    private boolean isCorrectAnswer(Question question, String answerText) {
        if (answerText == null || answerText.isBlank()) {
            return false;
        }

        if (question.getQuestionType() == QuestionType.MATCHING) {
            return isCorrectMatchingAnswer(question, answerText);
        }

        if (question.getQuestionType() == QuestionType.PRONUNCIATION
                || question.getQuestionType() == QuestionType.TOPIC_SPEAKING) {
            return isCorrectSpeakingAnswer(question, answerText);
        }

        String normalizedAnswer = answerText.trim();

        boolean matchedCorrectOption = questionOptionRepo.findByQuestionId(question.getId()).stream()
                .anyMatch(option -> option.isCorrect()
                        && option.getContent() != null
                        && normalizeComparableAnswer(option.getContent()).equals(normalizeComparableAnswer(normalizedAnswer)));

        if (matchedCorrectOption) {
            return true;
        }

        String correctAnswer = question.getCorrectAnswer();
        if (correctAnswer == null) {
            return false;
        }

        return normalizeComparableAnswer(correctAnswer).equals(normalizeComparableAnswer(normalizedAnswer));
    }

    private boolean isCorrectSpeakingAnswer(Question question, String answerText) {
        String correctAnswer = question.getCorrectAnswer();
        if (correctAnswer == null || correctAnswer.isBlank()) {
            return false;
        }

        String normalizedExpected = normalizeComparableAnswer(correctAnswer);
        String normalizedActual = normalizeComparableAnswer(answerText);

        if (normalizedExpected.isEmpty() || normalizedActual.isEmpty()) {
            return false;
        }

        if (normalizedExpected.equals(normalizedActual)) {
            return true;
        }

        return calculateSimilarity(normalizedExpected, normalizedActual) >= SPEAKING_PASS_SIMILARITY;
    }

    private boolean isCorrectMatchingAnswer(Question question, String answerText) {
        Map<String, String> submittedMap = parseStringMap(answerText);
        if (submittedMap == null || submittedMap.isEmpty()) {
            return false;
        }

        Map<String, String> expectedMap = resolveExpectedMatchingMap(question);
        if (expectedMap == null || expectedMap.isEmpty()) {
            return false;
        }

        for (Map.Entry<String, String> entry : expectedMap.entrySet()) {
            String left = normalize(entry.getKey());
            String expectedRight = normalize(entry.getValue());

            String submittedRight = normalize(submittedMap.get(entry.getKey()));
            if (submittedRight == null) {
                String matchedKey = submittedMap.keySet().stream()
                        .filter(key -> normalize(key).equals(left))
                        .findFirst()
                        .orElse(null);
                submittedRight = matchedKey == null ? null : normalize(submittedMap.get(matchedKey));
            }

            if (submittedRight == null || !submittedRight.equals(expectedRight)) {
                return false;
            }
        }

        return true;
    }

    private Map<String, String> resolveExpectedMatchingMap(Question question) {
        Map<String, String> fromCorrectAnswer = parseStringMap(question.getCorrectAnswer());
        if (fromCorrectAnswer != null && !fromCorrectAnswer.isEmpty()) {
            return fromCorrectAnswer;
        }

        if (question.getQuestionData() == null || question.getQuestionData().isBlank()) {
            return null;
        }

        try {
            Map<String, Object> data = objectMapper.readValue(
                    question.getQuestionData(),
                    new TypeReference<>() {
                    }
            );

            Object answersObj = data.get("answers");
            if (answersObj instanceof Map<?, ?> answersMap) {
                Map<String, String> normalizedMap = new LinkedHashMap<>();
                answersMap.forEach((k, v) -> {
                    if (k != null && v != null) {
                        normalizedMap.put(String.valueOf(k), String.valueOf(v));
                    }
                });
                if (!normalizedMap.isEmpty()) {
                    return normalizedMap;
                }
            }
        } catch (Exception ignored) {
            return null;
        }

        return null;
    }

    private Map<String, String> parseStringMap(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            Map<String, String> parsed = objectMapper.readValue(value, new TypeReference<>() {
            });
            return parsed == null || parsed.isEmpty() ? null : parsed;
        } catch (Exception ignored) {
            return null;
        }
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        return value.trim().replaceAll("\\s+", " ").toLowerCase();
    }

    private String normalizeComparableAnswer(String value) {
        if (value == null) {
            return "";
        }

        return value.trim()
                .replaceAll("[_-]+", " ")
                .replaceAll("[^\\p{L}\\p{N}\\s]", " ")
                .replaceAll("\\s+", " ")
                .toLowerCase();
    }

    private double calculateSimilarity(String left, String right) {
        int maxLength = Math.max(left.length(), right.length());
        if (maxLength == 0) {
            return 1.0;
        }

        int distance = levenshteinDistance(left, right);
        return 1.0 - ((double) distance / maxLength);
    }

    private int levenshteinDistance(String left, String right) {
        int leftLength = left.length();
        int rightLength = right.length();
        int[][] dp = new int[leftLength + 1][rightLength + 1];

        for (int i = 0; i <= leftLength; i++) {
            dp[i][0] = i;
        }

        for (int j = 0; j <= rightLength; j++) {
            dp[0][j] = j;
        }

        for (int i = 1; i <= leftLength; i++) {
            for (int j = 1; j <= rightLength; j++) {
                int substitutionCost = left.charAt(i - 1) == right.charAt(j - 1) ? 0 : 1;
                dp[i][j] = Math.min(
                        Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
                        dp[i - 1][j - 1] + substitutionCost
                );
            }
        }

        return dp[leftLength][rightLength];
    }

    private Long resolveLessonId(Question question) {
        if (question.getLesson() != null) {
            return question.getLesson().getId();
        }

        if (question.getQuestionGroup() != null && question.getQuestionGroup().getLesson() != null) {
            return question.getQuestionGroup().getLesson().getId();
        }

        return null;
    }

    private int calculateExpReward(User user) {
        return QUESTION_CORRECT_BASE_EXP_REWARD;
    }

    private void maybeCompleteLesson(User user, Long lessonId) {
        long totalQuestions = repo.countQuestionsByLessonId(lessonId);
        if (totalQuestions == 0) {
            return;
        }

        long answeredQuestions = repo.countAnsweredQuestionsByUserAndLesson(user.getId(), lessonId);
        if (answeredQuestions < totalQuestions) {
            return;
        }

        long correctQuestions = repo.countCorrectQuestionsByUserAndLesson(user.getId(), lessonId);
        double accuracy = (correctQuestions * 100.0) / totalQuestions;
        double score = accuracy / 10.0;

        learningProgressService.completeLesson(new UserLessonProgressRequest(lessonId, score, accuracy));
    }
}
