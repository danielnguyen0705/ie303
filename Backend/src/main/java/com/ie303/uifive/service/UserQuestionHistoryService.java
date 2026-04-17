package com.ie303.uifive.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ie303.uifive.dto.req.UserLessonProgressRequest;
import com.ie303.uifive.dto.req.UserQuestionHistoryRequest;
import com.ie303.uifive.dto.res.UserQuestionHistoryResponse;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.entity.QuestionType;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.entity.UserQuestionHistory;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.mapper.UserQuestionHistoryMapper;
import com.ie303.uifive.repo.QuestionRepo;
import com.ie303.uifive.repo.QuestionOptionRepo;
import com.ie303.uifive.repo.UserQuestionHistoryRepo;
import com.ie303.uifive.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserQuestionHistoryService {

    private static final int QUESTION_CORRECT_COIN_REWARD = 1;
    private static final int QUESTION_CORRECT_SCORE_REWARD = 1;
    private static final int QUESTION_CORRECT_BASE_EXP_REWARD = 10;

    private final UserQuestionHistoryRepo repo;
    private final UserRepo userRepo;
    private final QuestionRepo questionRepo;
    private final QuestionOptionRepo questionOptionRepo;
    private final UserQuestionHistoryMapper mapper;
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
        User finalUser = user;

        Question question = questionRepo.findById(request.questionId())
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));

        UserQuestionHistory history = repo.findByUserIdAndQuestionId(finalUser.getId(), request.questionId())
                .orElseGet(() -> {
                    UserQuestionHistory entity = mapper.toEntity(request);
                    entity.setUser(finalUser);
                    entity.setQuestion(question);
                    return entity;
                });

        boolean previouslyCorrect = history.isCorrect();
        boolean currentlyCorrect = isCorrectAnswer(question, request.answerText());

        mapper.updateEntityFromRequest(request, history);
        history.setUser(user);
        history.setQuestion(question);
        // Once a question is answered correctly, keep it correct to avoid reward farming.
        history.setCorrect(previouslyCorrect || currentlyCorrect);

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

        UserQuestionHistoryResponse response = mapper.toResponse(history);
        return response;
    }

    private boolean isCorrectAnswer(Question question, String answerText) {
        if (answerText == null || answerText.isBlank()) {
            return false;
        }

        if (question.getQuestionType() == QuestionType.MATCHING) {
            return isCorrectMatchingAnswer(question, answerText);
        }

        String normalizedAnswer = answerText.trim();

        boolean matchedCorrectOption = questionOptionRepo.findByQuestionId(question.getId()).stream()
                .anyMatch(option -> option.isCorrect()
                        && option.getContent() != null
                        && option.getContent().trim().equalsIgnoreCase(normalizedAnswer));
        if (matchedCorrectOption) {
            return true;
        }

        String correctAnswer = question.getCorrectAnswer();
        if (correctAnswer == null) {
            return false;
        }

        return correctAnswer.trim().equalsIgnoreCase(normalizedAnswer);
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

            Object leftObj = data.get("left");
            Object rightObj = data.get("right");
            if (leftObj instanceof List<?> leftList && rightObj instanceof List<?> rightList) {
                int size = Math.min(leftList.size(), rightList.size());
                Map<String, String> byOrderMap = new LinkedHashMap<>();

                for (int i = 0; i < size; i += 1) {
                    Object left = leftList.get(i);
                    Object right = rightList.get(i);
                    if (left != null && right != null) {
                        byOrderMap.put(String.valueOf(left), String.valueOf(right));
                    }
                }

                if (!byOrderMap.isEmpty()) {
                    return byOrderMap;
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
            Map<String, String> parsed = objectMapper.readValue(
                    value,
                    new TypeReference<>() {
                    }
            );

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
        double multiplier = resolveActiveExpMultiplier(user);
        return (int) Math.round(QUESTION_CORRECT_BASE_EXP_REWARD * multiplier);
    }

    private double resolveActiveExpMultiplier(User user) {
        LocalDateTime now = LocalDateTime.now();

        if (user.getExpBoostExpiredAt() == null || !user.getExpBoostExpiredAt().isAfter(now)) {
            return 1.0;
        }

        return Math.max(1.0, user.getExpBoostMultiplier());
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

    public UserQuestionHistoryResponse getById(Long id) {
        UserQuestionHistory entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy UserQuestionHistory với id = " + id));

        UserQuestionHistoryResponse response = mapper.toResponse(entity);
        return response;
    }

    public List<UserQuestionHistoryResponse> getAll() {
        List<UserQuestionHistory> entities = repo.findAll();

        List<UserQuestionHistoryResponse> responses = entities.stream()
                .map(mapper::toResponse)
                .toList();

        return responses;
    }

    public List<UserQuestionHistoryResponse> getByUserId(Long userId) {
        List<UserQuestionHistory> entities = repo.findByUserId(userId);

        List<UserQuestionHistoryResponse> responses = entities.stream()
                .map(mapper::toResponse)
                .toList();

        return responses;
    }

    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new AppException(ErrorCode.QUESTION_NOT_FOUND);
        }

        repo.deleteById(id);
    }
}