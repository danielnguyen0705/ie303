package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.MLPredictionRequest;
import com.ie303.uifive.dto.res.AILearningAnalysisResponse;
import com.ie303.uifive.dto.res.MLPredictionResponse;
import com.ie303.uifive.dto.res.SectionProgressResponse;
import com.ie303.uifive.dto.res.StudyingGradeResponse;
import com.ie303.uifive.dto.res.UnitProgressResponse;
import com.ie303.uifive.entity.AILearningAnalysis;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.entity.QuestionType;
import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.SkillType;
import com.ie303.uifive.entity.SkipUsageLog;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.entity.UserLessonProgress;
import com.ie303.uifive.entity.UserQuestionHistory;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.repo.AILearningAnalysisRepo;
import com.ie303.uifive.repo.SkipUsageLogRepo;
import com.ie303.uifive.repo.UserLessonProgressRepo;
import com.ie303.uifive.repo.UserQuestionHistoryRepo;
import com.ie303.uifive.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class LearningAnalysisService {

    private static final ZoneId ACTIVITY_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final int LESSON_COMPLETION_COIN_REWARD = 18;
    private static final int QUESTION_CORRECT_COIN_REWARD = 1;

    private final AILearningAnalysisRepo analysisRepo;
    private final UserRepo userRepo;
    private final LearningProgressService learningProgressService;
    private final UserQuestionHistoryRepo userQuestionHistoryRepo;
    private final UserLessonProgressRepo userLessonProgressRepo;
    private final SkipUsageLogRepo skipUsageLogRepo;

    @Value("${ml.api-url:${ML_API_URL:http://localhost:8000/predict}}")
    private String mlApiUrl;

    @Transactional
    public void saveAnalysis(Long userId, MLPredictionResponse response) {
        if (userId == null || response == null) {
            return;
        }

        User managedUser = userRepo.findById(userId).orElse(null);
        if (managedUser == null) {
            return;
        }

        AILearningAnalysis analysis = new AILearningAnalysis();
        analysis.setUser(managedUser);
        analysis.setStrongSkill(response.getStrongSkill());
        analysis.setWeakSkill(response.getWeakSkill());
        analysis.setTrendLabel(response.getTrendLabel());
        analysis.setWeakTopic(resolveWeakTopic(response.getWeakSkill()));
        analysis.setRecommendation(buildRecommendation(response.getWeakSkill(), response.getTrendLabel()));

        analysisRepo.save(analysis);
    }

    @Transactional(readOnly = true)
    public AILearningAnalysisResponse getLatestByUsername(String username) {
        User user = userRepo.findByUsername(username);
        if (user == null) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }

        return analysisRepo.findTopByUserOrderByGeneratedAtDesc(user)
                .map(this::toResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<AILearningAnalysisResponse> getHistoryByUsername(String username) {
        User user = userRepo.findByUsername(username);
        if (user == null) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }

        return analysisRepo.findByUserOrderByGeneratedAtDesc(user)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AILearningAnalysisResponse refreshAnalysis() {
        User user = getCurrentUser();
        MLPredictionRequest request = buildPredictionRequest(user);

        MLPredictionResponse prediction = callMlService(request);
        if (prediction == null) {
            AILearningAnalysisResponse latest = getLatestByUsername(user.getUsername());
            if (latest == null) {
                throw new AppException(ErrorCode.INVALID_REQUEST, "ML service is unavailable and no prior analysis exists");
            }

            prediction = new MLPredictionResponse();
            prediction.setStrongSkill(latest.strongSkill());
            prediction.setWeakSkill(latest.weakSkill());
            prediction.setTrendLabel(latest.trendLabel());
        }

        saveAnalysis(user.getId(), prediction);
        return getLatestByUsername(user.getUsername());
    }

    private AILearningAnalysisResponse toResponse(AILearningAnalysis analysis) {
        return new AILearningAnalysisResponse(
                analysis.getId(),
                analysis.getStrongSkill(),
                analysis.getWeakSkill(),
                analysis.getTrendLabel(),
                analysis.getWeakTopic(),
                analysis.getRecommendation(),
                analysis.getGeneratedAt()
        );
    }

    private User getCurrentUser() {
        String username = resolveCurrentUsername();
        User user = userRepo.findByUsername(username);
        if (user == null) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }

        return user;
    }

    private String resolveCurrentUsername() {
        String username = SecurityContextHolder.getContext().getAuthentication() == null
                ? null
                : SecurityContextHolder.getContext().getAuthentication().getName();

        if (username == null || username.isBlank()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        return username;
    }

    private MLPredictionResponse callMlService(MLPredictionRequest request) {
        try {
            MLPredictionResponse response = RestClient.create()
                    .post()
                    .uri(mlApiUrl)
                    .body(request)
                    .retrieve()
                    .body(MLPredictionResponse.class);

            if (response == null) {
                log.warn("ML service returned an empty response from {}", mlApiUrl);
            }

            return response;
        } catch (RestClientResponseException ex) {
            log.warn("ML service returned HTTP {} from {}: {}", ex.getStatusCode().value(), mlApiUrl, ex.getResponseBodyAsString());
            return null;
        } catch (RestClientException ex) {
            log.warn("ML service call failed for {}: {}", mlApiUrl, ex.getMessage());
            return null;
        }
    }

    private MLPredictionRequest buildPredictionRequest(User user) {
        String username = user.getUsername();
        List<StudyingGradeResponse> studyingGrades = learningProgressService.getStudyingGradesByUsername(username);
        Long gradeId = selectPrimaryGradeId(studyingGrades);

        List<UnitProgressResponse> units = learningProgressService.getUnitsByGrade(gradeId);
        double unitProgressPercent = averageUnitProgress(units);
        double sectionProgressPercent = averageSectionProgress(units);

        WindowStats stats7d = collectWindowStats(user.getId(), 7);
        WindowStats stats14d = collectWindowStats(user.getId(), 14);
        WindowStats stats30d = collectWindowStats(user.getId(), 30);
        SkillAccuracy skillAccuracy30d = calculateSkillAccuracy(stats30d.questionHistories());

        return new MLPredictionRequest(
                user.getRole() == null ? Role.USER.name() : user.getRole().name(),
                user.getCoin(),
                user.getScore(),
                user.getStreak(),
                daysSinceLastStudy(user),
                vipDaysRemaining(user),
                userServiceHasVipAccess(user) ? 1 : 0,
                gradeId,
                unitProgressPercent,
                sectionProgressPercent,
                stats7d.activeDays(),
                stats14d.activeDays(),
                stats30d.activeDays(),
                stats7d.lessonsCompleted(),
                stats14d.lessonsCompleted(),
                stats30d.lessonsCompleted(),
                stats7d.questionsAnswered(),
                stats14d.questionsAnswered(),
                stats30d.questionsAnswered(),
                stats7d.accuracy(),
                stats14d.accuracy(),
                stats30d.accuracy(),
                stats7d.avgAttemptCount(),
                stats7d.coinsEarned(),
                stats30d.coinsEarned(),
                0,
                0,
                0.0,
                0.0,
                safeInt(user.getStreakItemPendingCount()),
                skillAccuracy30d.listening(),
                skillAccuracy30d.speaking(),
                skillAccuracy30d.reading(),
                skillAccuracy30d.writing(),
                skillAccuracy30d.vocabulary(),
                skillAccuracy30d.grammar()
        );
    }

    private WindowStats collectWindowStats(Long userId, int days) {
        LocalDateTime now = LocalDateTime.now(ACTIVITY_ZONE);
        LocalDateTime from = now.minusDays(days);

        List<UserQuestionHistory> questionHistories =
                userQuestionHistoryRepo.findByUserIdAndAnsweredAtGreaterThanEqualAndAnsweredAtLessThan(
                        userId, from, now);
        List<UserLessonProgress> lessonProgresses =
                userLessonProgressRepo.findByUserIdAndCompletedTrueAndCompletedAtGreaterThanEqualAndCompletedAtLessThan(
                        userId, from, now);
        List<SkipUsageLog> skipUsageLogs =
                skipUsageLogRepo.findByUserIdAndUsedAtGreaterThanEqualAndUsedAtLessThan(userId, from, now);

        return new WindowStats(
                questionHistories,
                lessonProgresses,
                skipUsageLogs,
                countActiveDays(questionHistories, lessonProgresses, skipUsageLogs),
                lessonProgresses.size(),
                questionHistories.size(),
                calculateAccuracy(questionHistories),
                calculateAverageAttemptCount(questionHistories),
                calculateCoinsEarned(questionHistories, lessonProgresses)
        );
    }

    private int countActiveDays(
            List<UserQuestionHistory> questionHistories,
            List<UserLessonProgress> lessonProgresses,
            List<SkipUsageLog> skipUsageLogs
    ) {
        Set<LocalDate> activeDays = new java.util.HashSet<>();

        for (UserQuestionHistory history : questionHistories) {
            if (history.getAnsweredAt() != null) {
                activeDays.add(history.getAnsweredAt().toLocalDate());
            }
        }

        for (UserLessonProgress progress : lessonProgresses) {
            if (progress.getCompletedAt() != null) {
                activeDays.add(progress.getCompletedAt().toLocalDate());
            }
        }

        for (SkipUsageLog logEntry : skipUsageLogs) {
            if (logEntry.getUsedAt() != null) {
                activeDays.add(logEntry.getUsedAt().toLocalDate());
            }
        }

        return activeDays.size();
    }

    private double calculateAccuracy(List<UserQuestionHistory> histories) {
        if (histories == null || histories.isEmpty()) {
            return 0.0;
        }

        long correct = histories.stream().filter(UserQuestionHistory::isCorrect).count();
        return (correct * 100.0) / histories.size();
    }

    private double calculateAverageAttemptCount(List<UserQuestionHistory> histories) {
        if (histories == null || histories.isEmpty()) {
            return 0.0;
        }

        return 1.0;
    }

    private int calculateCoinsEarned(List<UserQuestionHistory> histories, List<UserLessonProgress> progresses) {
        int questionCoins = (int) histories.stream().filter(UserQuestionHistory::isCorrect).count() * QUESTION_CORRECT_COIN_REWARD;
        int lessonCoins = progresses.size() * LESSON_COMPLETION_COIN_REWARD;
        return questionCoins + lessonCoins;
    }

    private double averageUnitProgress(List<UnitProgressResponse> units) {
        if (units == null || units.isEmpty()) {
            return 0.0;
        }

        return units.stream()
                .mapToDouble(UnitProgressResponse::progressPercent)
                .average()
                .orElse(0.0);
    }

    private double averageSectionProgress(List<UnitProgressResponse> units) {
        if (units == null || units.isEmpty()) {
            return 0.0;
        }

        List<SectionProgressResponse> sections = units.stream()
                .flatMap(unit -> learningProgressService.getSectionsByUnit(unit.unitId()).stream())
                .toList();

        if (sections.isEmpty()) {
            return 0.0;
        }

        return sections.stream()
                .mapToDouble(SectionProgressResponse::progressPercent)
                .average()
                .orElse(0.0);
    }

    private Long selectPrimaryGradeId(List<StudyingGradeResponse> studyingGrades) {
        if (studyingGrades == null || studyingGrades.isEmpty()) {
            return 1L;
        }

        return studyingGrades.stream()
                .max(Comparator.comparingDouble(StudyingGradeResponse::progressPercent))
                .map(StudyingGradeResponse::gradeId)
                .orElse(1L);
    }

    private SkillAccuracy calculateSkillAccuracy(List<UserQuestionHistory> histories) {
        Map<SkillType, int[]> counters = new EnumMap<>(SkillType.class);
        for (SkillType skillType : SkillType.values()) {
            counters.put(skillType, new int[2]);
        }

        for (UserQuestionHistory history : histories) {
            Question question = history.getQuestion();
            if (question == null) {
                continue;
            }

            SkillType skillType = resolveSkillType(question);
            int[] values = counters.computeIfAbsent(skillType, ignored -> new int[2]);
            values[1]++;
            if (history.isCorrect()) {
                values[0]++;
            }
        }

        return new SkillAccuracy(
                percentage(counters.get(SkillType.LISTENING)),
                percentage(counters.get(SkillType.SPEAKING)),
                percentage(counters.get(SkillType.READING)),
                percentage(counters.get(SkillType.WRITING)),
                percentage(counters.get(SkillType.VOCABULARY)),
                percentage(counters.get(SkillType.GRAMMAR))
        );
    }

    private SkillType resolveSkillType(Question question) {
        if (question.getLesson() != null && question.getLesson().getSkillType() != null) {
            return question.getLesson().getSkillType();
        }

        if (question.getQuestionGroup() != null
                && question.getQuestionGroup().getLesson() != null
                && question.getQuestionGroup().getLesson().getSkillType() != null) {
            return question.getQuestionGroup().getLesson().getSkillType();
        }

        QuestionType questionType = question.getQuestionType();
        if (questionType == null) {
            return SkillType.VOCABULARY;
        }

        return switch (questionType) {
            case PRONUNCIATION, TOPIC_SPEAKING -> SkillType.SPEAKING;
            case ESSAY_WRITING -> SkillType.WRITING;
            case READING_MC, TRUE_FALSE_NG -> SkillType.READING;
            case WORD_FORM, VERB_FORM, SENTENCE_REORDER, SENTENCE_REWRITE -> SkillType.GRAMMAR;
            case CLOZE_MC, WORD_BANK_FILL, LIMITED_FILL, MATCHING, QUALITATIVE_MC -> SkillType.VOCABULARY;
        };
    }

    private double percentage(int[] counter) {
        if (counter == null || counter[1] == 0) {
            return 0.0;
        }

        return (counter[0] * 100.0) / counter[1];
    }

    private String resolveWeakTopic(String weakSkill) {
        if (weakSkill == null || weakSkill.isBlank()) {
            return "general";
        }

        return weakSkill.trim();
    }

    private String buildRecommendation(String weakSkill, String trendLabel) {
        String normalizedSkill = weakSkill == null ? "general" : weakSkill.trim().toLowerCase();
        String trendText = trendLabel == null ? "stable" : trendLabel.trim().toLowerCase();

        String recommendation = switch (normalizedSkill) {
            case "listening" -> "Practice short listening drills every day and replay difficult sections.";
            case "speaking" -> "Record your speaking answers, compare pronunciation, and repeat key phrases.";
            case "reading" -> "Read one passage daily and highlight unknown words or patterns.";
            case "writing" -> "Write a short paragraph daily and review grammar mistakes carefully.";
            case "vocabulary" -> "Review 10 new words daily with spaced repetition and example sentences.";
            case "grammar" -> "Focus on one grammar rule at a time and do targeted exercises.";
            default -> "Keep practicing consistently and review the weakest area after each study session.";
        };

        if ("declining".equals(trendText)) {
            return recommendation + " Your trend is declining, so reduce gaps between study sessions.";
        }

        if ("improving".equals(trendText)) {
            return recommendation + " Your trend is improving, so keep the current pace.";
        }

        return recommendation;
    }

    private int daysSinceLastStudy(User user) {
        if (user.getLastStudyDate() == null) {
            return 0;
        }

        long diff = java.time.temporal.ChronoUnit.DAYS.between(user.getLastStudyDate(), LocalDate.now(ACTIVITY_ZONE));
        return (int) Math.max(0, diff);
    }

    private int vipDaysRemaining(User user) {
        if (user.getVipExpiredAt() == null) {
            return 0;
        }

        long diff = Duration.between(LocalDateTime.now(ACTIVITY_ZONE), user.getVipExpiredAt()).toDays();
        return (int) Math.max(0, diff);
    }

    private boolean userServiceHasVipAccess(User user) {
        return user.getVipExpiredAt() != null && user.getVipExpiredAt().isAfter(LocalDateTime.now(ACTIVITY_ZONE));
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }

    private record WindowStats(
            List<UserQuestionHistory> questionHistories,
            List<UserLessonProgress> lessonProgresses,
            List<SkipUsageLog> skipUsageLogs,
            int activeDays,
            int lessonsCompleted,
            int questionsAnswered,
            double accuracy,
            double avgAttemptCount,
            int coinsEarned
    ) {
    }

    private record SkillAccuracy(
            double listening,
            double speaking,
            double reading,
            double writing,
            double vocabulary,
            double grammar
    ) {
    }
}
