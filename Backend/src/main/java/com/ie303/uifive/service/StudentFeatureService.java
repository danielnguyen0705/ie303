package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.MLPredictionRequest;
import com.ie303.uifive.entity.AISpeakingEvaluation;
import com.ie303.uifive.entity.AIWritingEvaluation;
import com.ie303.uifive.entity.ItemType;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.entity.QuestionGroupType;
import com.ie303.uifive.entity.QuestionType;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.entity.UserItem;
import com.ie303.uifive.entity.UserLessonProgress;
import com.ie303.uifive.entity.UserQuestionHistory;
import com.ie303.uifive.repo.AISpeakingEvaluationRepo;
import com.ie303.uifive.repo.AIWritingEvalutionRepo;
import com.ie303.uifive.repo.LessonRepo;
import com.ie303.uifive.repo.UserItemRepo;
import com.ie303.uifive.repo.UserLessonProgressRepo;
import com.ie303.uifive.repo.UserQuestionHistoryRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class StudentFeatureService {

    private static final int DEFAULT_NO_ACTIVITY_DAYS = 999;

    private final UserQuestionHistoryRepo userQuestionHistoryRepo;
    private final UserLessonProgressRepo userLessonProgressRepo;
    private final UserItemRepo userItemRepo;
    private final AIWritingEvalutionRepo aiWritingEvalutionRepo;
    private final AISpeakingEvaluationRepo aiSpeakingEvaluationRepo;
    private final LessonRepo lessonRepo;

    @Transactional(readOnly = true)
    public MLPredictionRequest buildPredictionRequest(User user) {
        List<UserQuestionHistory> histories = userQuestionHistoryRepo.findByUserId(user.getId());
        List<UserLessonProgress> progresses = userLessonProgressRepo.findAll().stream()
                .filter(progress -> progress.getUser() != null && user.getId().equals(progress.getUser().getId()))
                .toList();
        List<AIWritingEvaluation> writingEvaluations = aiWritingEvalutionRepo.findAll().stream()
                .filter(evaluation -> evaluation.getUser() != null && user.getId().equals(evaluation.getUser().getId()))
                .toList();
        List<AISpeakingEvaluation> speakingEvaluations = aiSpeakingEvaluationRepo.findAll().stream()
                .filter(evaluation -> evaluation.getUser() != null && user.getId().equals(evaluation.getUser().getId()))
                .toList();
        List<UserItem> userItems = userItemRepo.findByUser(user);

        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        Long activeGradeId = resolveCurrentGradeId(progresses, histories);

        Long currentLessonId = resolveCurrentLessonId(progresses, histories);
        double unitProgressPercent = 0.0;
        double sectionProgressPercent = 0.0;
        if (currentLessonId != null) {
            Optional<UserLessonProgress> currentProgress = progresses.stream()
                    .filter(progress -> progress.getLesson() != null && currentLessonId.equals(progress.getLesson().getId()))
                    .findFirst();

            if (currentProgress.isPresent()) {
                UserLessonProgress progress = currentProgress.get();
                Long unitId = progress.getLesson().getSection().getUnit().getId();
                Long sectionId = progress.getLesson().getSection().getId();
                unitProgressPercent = calculateUnitProgress(user, unitId);
                sectionProgressPercent = calculateSectionProgress(user, sectionId);
            }
        }

        int daysSinceLastStudy = user.getLastStudyDate() == null
                ? DEFAULT_NO_ACTIVITY_DAYS
                : (int) ChronoUnit.DAYS.between(user.getLastStudyDate(), today);

        int vipDaysRemaining = 0;
        int isVipActive = 0;
        if (user.getVipExpiredAt() != null && user.getVipExpiredAt().isAfter(now)) {
            vipDaysRemaining = (int) Math.max(0, ChronoUnit.DAYS.between(now.toLocalDate(), user.getVipExpiredAt().toLocalDate()));
            isVipActive = 1;
        }

        int activeDays7d = countActiveDays(histories, progresses, today, 7);
        int activeDays14d = countActiveDays(histories, progresses, today, 14);
        int activeDays30d = countActiveDays(histories, progresses, today, 30);

        int lessonsCompleted7d = countLessonsCompleted(progresses, now, 7);
        int lessonsCompleted14d = countLessonsCompleted(progresses, now, 14);
        int lessonsCompleted30d = countLessonsCompleted(progresses, now, 30);

        int questionsAnswered7d = countQuestionsAnswered(histories, now, 7);
        int questionsAnswered14d = countQuestionsAnswered(histories, now, 14);
        int questionsAnswered30d = countQuestionsAnswered(histories, now, 30);

        double accuracy7d = calculateAccuracyPercent(histories, now, 7);
        double accuracy14d = calculateAccuracyPercent(histories, now, 14);
        double accuracy30d = calculateAccuracyPercent(histories, now, 30);

        double avgAttemptCount7d = 1.0;

        int coinsEarned7d = calculateCoinsEarned(histories, progresses, now, 7);
        int coinsEarned30d = calculateCoinsEarned(histories, progresses, now, 30);

        int writingEvalCount30d = countEvaluations(writingEvaluations, now, 30);
        int speakingEvalCount30d = countEvaluations(speakingEvaluations, now, 30);
        double avgWritingAiScore30d = averageEvaluationScore(writingEvaluations, now, 30);
        double avgSpeakingAiScore30d = averageEvaluationScore(speakingEvaluations, now, 30);

        int skipItemQuantity = userItems.stream()
                .filter(item -> item.getItem() != null && item.getItem().getType() == ItemType.SKIP)
                .mapToInt(UserItem::getQuantity)
                .sum();

        SkillRatio listeningAccuracy = calculateSkillRatio(histories, now, 30, this::isListeningQuestion);
        SkillRatio speakingAccuracy = calculateSkillRatio(histories, now, 30, this::isSpeakingQuestion);
        SkillRatio readingAccuracy = calculateSkillRatio(histories, now, 30, this::isReadingQuestion);
        SkillRatio writingAccuracy = calculateSkillRatio(histories, now, 30, this::isWritingQuestion);
        SkillRatio vocabularyAccuracy = calculateSkillRatio(histories, now, 30, this::isVocabularyQuestion);
        SkillRatio grammarAccuracy = calculateSkillRatio(histories, now, 30, this::isGrammarQuestion);

        return MLPredictionRequest.builder()
                .role(user.getRole() != null ? user.getRole().name() : "USER")
                .coin(user.getCoin())
                .score(user.getScore())
                .streak(user.getStreak())
                .days_since_last_study(daysSinceLastStudy)
                .vip_days_remaining(vipDaysRemaining)
                .is_vip_active(isVipActive)
                .grade_id(activeGradeId)
                .unit_progress_percent(unitProgressPercent)
                .section_progress_percent(sectionProgressPercent)
                .active_days_7d(activeDays7d)
                .active_days_14d(activeDays14d)
                .active_days_30d(activeDays30d)
                .lessons_completed_7d(lessonsCompleted7d)
                .lessons_completed_14d(lessonsCompleted14d)
                .lessons_completed_30d(lessonsCompleted30d)
                .questions_answered_7d(questionsAnswered7d)
                .questions_answered_14d(questionsAnswered14d)
                .questions_answered_30d(questionsAnswered30d)
                .accuracy_7d(accuracy7d)
                .accuracy_14d(accuracy14d)
                .accuracy_30d(accuracy30d)
                .avg_attempt_count_7d(avgAttemptCount7d)
                .coins_earned_7d(coinsEarned7d)
                .coins_earned_30d(coinsEarned30d)
                .writing_eval_count_30d(writingEvalCount30d)
                .speaking_eval_count_30d(speakingEvalCount30d)
                .avg_writing_ai_score_30d(avgWritingAiScore30d)
                .avg_speaking_ai_score_30d(avgSpeakingAiScore30d)
                .skip_item_quantity(skipItemQuantity)
                .listening_accuracy_30d(listeningAccuracy.accuracy())
                .speaking_accuracy_30d(speakingAccuracy.accuracy())
                .reading_accuracy_30d(readingAccuracy.accuracy())
                .writing_accuracy_30d(writingAccuracy.accuracy())
                .vocabulary_accuracy_30d(vocabularyAccuracy.accuracy())
                .grammar_accuracy_30d(grammarAccuracy.accuracy())
                .build();
    }

    private Long resolveCurrentGradeId(List<UserLessonProgress> progresses, List<UserQuestionHistory> histories) {
        return progresses.stream()
                .filter(progress -> progress.getLesson() != null
                        && progress.getLesson().getSection() != null
                        && progress.getLesson().getSection().getUnit() != null
                        && progress.getLesson().getSection().getUnit().getGrade() != null)
                .max(Comparator.comparing(this::progressActivityTime))
                .map(progress -> progress.getLesson().getSection().getUnit().getGrade().getId())
                .orElseGet(() -> histories.stream()
                        .filter(history -> history.getQuestion() != null)
                        .max(Comparator.comparing(history -> history.getAnsweredAt() == null ? LocalDateTime.MIN : history.getAnsweredAt()))
                        .map(history -> resolveGradeId(history.getQuestion()))
                        .orElse(1L));
    }

    private Long resolveCurrentLessonId(List<UserLessonProgress> progresses, List<UserQuestionHistory> histories) {
        Optional<UserLessonProgress> latestProgress = progresses.stream()
                .filter(progress -> progress.getLesson() != null)
                .max(Comparator.comparing(this::progressActivityTime));
        if (latestProgress.isPresent()) {
            return latestProgress.get().getLesson().getId();
        }

        return histories.stream()
                .filter(history -> history.getQuestion() != null)
                .max(Comparator.comparing(history -> history.getAnsweredAt() == null ? LocalDateTime.MIN : history.getAnsweredAt()))
                .map(history -> resolveLessonId(history.getQuestion()))
                .orElse(null);
    }

    private double calculateUnitProgress(User user, Long unitId) {
        int completedLessons = userLessonProgressRepo.countCompletedLessonsByUserAndUnit(user, unitId);
        int totalLessonsInUnit = lessonRepo.countLessonsByUnitId(unitId);
        if (totalLessonsInUnit == 0) {
            return 0.0;
        }
        return 100.0 * completedLessons / totalLessonsInUnit;
    }

    private double calculateSectionProgress(User user, Long sectionId) {
        int completedLessons = userLessonProgressRepo.countCompletedLessonsByUserAndSection(user, sectionId);
        int totalLessonsInSection = lessonRepo.countLessonsBySectionId(sectionId);
        if (totalLessonsInSection == 0) {
            return 0.0;
        }
        return 100.0 * completedLessons / totalLessonsInSection;
    }

    private int countActiveDays(List<UserQuestionHistory> histories, List<UserLessonProgress> progresses, LocalDate today, int days) {
        Set<LocalDate> dates = new HashSet<>();
        LocalDate from = today.minusDays(days - 1L);

        histories.stream()
                .map(UserQuestionHistory::getAnsweredAt)
                .filter(dateTime -> dateTime != null && !dateTime.toLocalDate().isBefore(from))
                .forEach(dateTime -> dates.add(dateTime.toLocalDate()));

        progresses.stream()
                .map(UserLessonProgress::getLastAccessedAt)
                .filter(dateTime -> dateTime != null && !dateTime.toLocalDate().isBefore(from))
                .forEach(dateTime -> dates.add(dateTime.toLocalDate()));

        progresses.stream()
                .map(UserLessonProgress::getCompletedAt)
                .filter(dateTime -> dateTime != null && !dateTime.toLocalDate().isBefore(from))
                .forEach(dateTime -> dates.add(dateTime.toLocalDate()));

        return dates.size();
    }

    private int countLessonsCompleted(List<UserLessonProgress> progresses, LocalDateTime now, int days) {
        LocalDateTime from = now.minusDays(days - 1L);
        return (int) progresses.stream()
                .filter(progress -> progress.isCompleted())
                .map(UserLessonProgress::getCompletedAt)
                .filter(dateTime -> dateTime != null && !dateTime.isBefore(from))
                .count();
    }

    private int countQuestionsAnswered(List<UserQuestionHistory> histories, LocalDateTime now, int days) {
        LocalDateTime from = now.minusDays(days - 1L);
        return (int) histories.stream()
                .map(UserQuestionHistory::getAnsweredAt)
                .filter(dateTime -> dateTime != null && !dateTime.isBefore(from))
                .count();
    }

    private double calculateAccuracyPercent(List<UserQuestionHistory> histories, LocalDateTime now, int days) {
        LocalDateTime from = now.minusDays(days - 1L);
        List<UserQuestionHistory> window = histories.stream()
                .filter(history -> history.getAnsweredAt() != null && !history.getAnsweredAt().isBefore(from))
                .toList();

        if (window.isEmpty()) {
            return 0.0;
        }

        long correct = window.stream().filter(UserQuestionHistory::isCorrect).count();
        return (correct * 100.0) / window.size();
    }

    private int calculateCoinsEarned(List<UserQuestionHistory> histories, List<UserLessonProgress> progresses, LocalDateTime now, int days) {
        LocalDateTime from = now.minusDays(days - 1L);
        int questionCoins = (int) histories.stream()
                .filter(UserQuestionHistory::isCorrect)
                .filter(history -> history.getAnsweredAt() != null && !history.getAnsweredAt().isBefore(from))
                .count();

        int lessonCoins = (int) progresses.stream()
                .filter(UserLessonProgress::isCompleted)
                .filter(progress -> progress.getCompletedAt() != null && !progress.getCompletedAt().isBefore(from))
                .count() * 18;

        return questionCoins + lessonCoins;
    }

    private int countEvaluations(List<?> evaluations, LocalDateTime now, int days) {
        LocalDateTime from = now.minusDays(days - 1L);
        return (int) evaluations.stream()
                .filter(eval -> {
                    LocalDateTime createdAt;
                    if (eval instanceof AIWritingEvaluation writing) {
                        createdAt = writing.getCreatedAt();
                    } else if (eval instanceof AISpeakingEvaluation speaking) {
                        createdAt = speaking.getCreatedAt();
                    } else {
                        createdAt = null;
                    }
                    return createdAt != null && !createdAt.isBefore(from);
                })
                .count();
    }

    private double averageEvaluationScore(List<?> evaluations, LocalDateTime now, int days) {
        LocalDateTime from = now.minusDays(days - 1L);
        return evaluations.stream()
                .mapToDouble(eval -> {
                    LocalDateTime createdAt;
                    double score;
                    if (eval instanceof AIWritingEvaluation writing) {
                        createdAt = writing.getCreatedAt();
                        score = writing.getAiScore();
                    } else if (eval instanceof AISpeakingEvaluation speaking) {
                        createdAt = speaking.getCreatedAt();
                        score = speaking.getAiScore();
                    } else {
                        return Double.NaN;
                    }
                    return createdAt != null && !createdAt.isBefore(from) ? score : Double.NaN;
                })
                .filter(value -> !Double.isNaN(value))
                .average()
                .orElse(0.0);
    }

    private SkillRatio calculateSkillRatio(List<UserQuestionHistory> histories, LocalDateTime now, int days, SkillClassifier classifier) {
        LocalDateTime from = now.minusDays(days - 1L);
        List<UserQuestionHistory> window = histories.stream()
                .filter(history -> history.getAnsweredAt() != null && !history.getAnsweredAt().isBefore(from))
                .filter(history -> history.getQuestion() != null)
                .filter(history -> classifier.matches(history.getQuestion()))
                .toList();

        if (window.isEmpty()) {
            return new SkillRatio(0.0, 0);
        }

        long correct = window.stream().filter(UserQuestionHistory::isCorrect).count();
        return new SkillRatio((correct * 100.0) / window.size(), window.size());
    }

    private boolean isListeningQuestion(Question question) {
        return (question.getQuestionGroup() != null
                && question.getQuestionGroup().getGroupType() == QuestionGroupType.LISTENING_PASSAGE)
                || (question.getAudioUrl() != null && !question.getAudioUrl().isBlank()
                && !isSpeakingQuestion(question));
    }

    private boolean isSpeakingQuestion(Question question) {
        return question.getQuestionType() == QuestionType.PRONUNCIATION
                || question.getQuestionType() == QuestionType.TOPIC_SPEAKING
                || question.getQuestionGroup() != null
                && question.getQuestionGroup().getGroupType() == QuestionGroupType.SPEAKING_TASK;
    }

    private boolean isReadingQuestion(Question question) {
        if (question.getQuestionGroup() != null) {
            QuestionGroupType groupType = question.getQuestionGroup().getGroupType();
            if (groupType == QuestionGroupType.READING_PASSAGE) {
                return true;
            }
        }

        return question.getQuestionType() == QuestionType.READING_MC
                || question.getQuestionType() == QuestionType.TRUE_FALSE_NG
                || question.getQuestionType() == QuestionType.MATCHING;
    }

    private boolean isWritingQuestion(Question question) {
        if (question.getQuestionGroup() != null && question.getQuestionGroup().getGroupType() == QuestionGroupType.WRITING_TASK) {
            return true;
        }

        return question.getQuestionType() == QuestionType.ESSAY_WRITING
                || question.getQuestionType() == QuestionType.SENTENCE_REWRITE;
    }

    private boolean isVocabularyQuestion(Question question) {
        return question.getQuestionType() == QuestionType.QUALITATIVE_MC
                || question.getQuestionType() == QuestionType.CLOZE_MC
                || question.getQuestionType() == QuestionType.WORD_BANK_FILL
                || question.getQuestionType() == QuestionType.LIMITED_FILL
                || question.getQuestionType() == QuestionType.WORD_FORM
                || question.getQuestionType() == QuestionType.MATCHING;
    }

    private boolean isGrammarQuestion(Question question) {
        return question.getQuestionType() == QuestionType.VERB_FORM
                || question.getQuestionType() == QuestionType.SENTENCE_REORDER
                || question.getQuestionType() == QuestionType.SENTENCE_REWRITE;
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

    private Long resolveGradeId(Question question) {
        if (question.getLesson() != null && question.getLesson().getSection() != null
                && question.getLesson().getSection().getUnit() != null
                && question.getLesson().getSection().getUnit().getGrade() != null) {
            return question.getLesson().getSection().getUnit().getGrade().getId();
        }

        if (question.getQuestionGroup() != null
                && question.getQuestionGroup().getLesson() != null
                && question.getQuestionGroup().getLesson().getSection() != null
                && question.getQuestionGroup().getLesson().getSection().getUnit() != null
                && question.getQuestionGroup().getLesson().getSection().getUnit().getGrade() != null) {
            return question.getQuestionGroup().getLesson().getSection().getUnit().getGrade().getId();
        }

        return 1L;
    }

    private LocalDateTime progressActivityTime(UserLessonProgress progress) {
        return progress.getLastAccessedAt() != null
                ? progress.getLastAccessedAt()
                : (progress.getCompletedAt() != null ? progress.getCompletedAt() : LocalDateTime.MIN);
    }

    private interface SkillClassifier {
        boolean matches(Question question);
    }

    private record SkillRatio(double accuracy, int total) {
    }
}
