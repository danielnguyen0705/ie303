package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.SubmitSpeakingRequest;
import com.ie303.uifive.dto.res.SpeakingEvaluationResponse;
import com.ie303.uifive.entity.AISpeakingEvaluation;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.entity.QuestionType;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.entity.UserQuestionHistory;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.repo.AISpeakingEvaluationRepo;
import com.ie303.uifive.repo.QuestionRepo;
import com.ie303.uifive.repo.UserQuestionHistoryRepo;
import com.ie303.uifive.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class SpeakingService {

    private static final int QUESTION_CORRECT_COIN_REWARD = 1;
    private static final int QUESTION_CORRECT_SCORE_REWARD = 1;
    private static final int QUESTION_CORRECT_BASE_EXP_REWARD = 10;

    private final QuestionRepo questionRepo;
    private final UserQuestionHistoryRepo historyRepo;
    private final AISpeakingEvaluationRepo evaluationRepo;
    private final UserRepo userRepo;
    private final UserService userService;
    private final LearningProgressService learningProgressService;
    private final AiGenerationService aiGenerationService;
    private final CloudinaryService cloudinaryService;

    public SpeakingEvaluationResponse submitSpeaking(User user, SubmitSpeakingRequest request) {
        Question question = questionRepo.findById(request.questionId())
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));

        if (question.getQuestionType() != QuestionType.PRONUNCIATION
                && question.getQuestionType() != QuestionType.TOPIC_SPEAKING) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Question is not a speaking question");
        }

        String audioUrl = resolveAudioUrl(request.audioFile());
        String transcriptText = resolveTranscript(request.transcriptText());
        SpeakingEvaluationResponse aiResult = aiGenerationService.evaluateSpeaking(
                question.getContent(),
                question.getExplanation(),
                transcriptText
        );

        User current = userRepo.findById(user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        userService.touchStudyStreak(current.getId());
        current = userRepo.findById(user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        final User finalCurrent = current;

        UserQuestionHistory history = historyRepo.findByUserIdAndQuestionId(finalCurrent.getId(), question.getId())
                .orElseGet(() -> {
                    UserQuestionHistory entity = new UserQuestionHistory();
                    entity.setUser(finalCurrent);
                    entity.setQuestion(question);
                    return entity;
                });

        boolean previouslyCorrect = history.isCorrect();
        boolean currentlyCorrect = aiResult.score() >= 5.0;

        history.setUser(current);
        history.setQuestion(question);
        history.setAnswerText(transcriptText);
        history.setCorrect(currentlyCorrect);
        historyRepo.save(history);

        if (!previouslyCorrect && history.isCorrect()) {
            current.setCoin(current.getCoin() + QUESTION_CORRECT_COIN_REWARD);
            current.setScore(current.getScore() + QUESTION_CORRECT_SCORE_REWARD);
            int expEarned = calculateExpReward(current);
            current.setExp(current.getExp() + expEarned);
            userRepo.save(current);
        }

        saveSpeakingEvaluation(current, question, audioUrl, transcriptText, aiResult);
        maybeCompleteLesson(current, question);

        return new SpeakingEvaluationResponse(aiResult.score(), aiResult.feedback(), transcriptText, audioUrl);
    }

    private void saveSpeakingEvaluation(User user,
                                        Question question,
                                        String audioUrl,
                                        String transcriptText,
                                        SpeakingEvaluationResponse aiResult) {
        AISpeakingEvaluation evaluation = evaluationRepo
                .findByUserIdAndQuestionId(user.getId(), question.getId())
                .orElseGet(AISpeakingEvaluation::new);
        evaluation.setUser(user);
        evaluation.setQuestion(question);
        evaluation.setAudioUrl(audioUrl);
        evaluation.setTranscriptText(transcriptText);
        evaluation.setAiScore(aiResult.score());
        evaluation.setAiFeedback(aiResult.feedback());
        evaluationRepo.save(evaluation);
    }

    private String resolveAudioUrl(MultipartFile audioFile) {
        if (audioFile == null || audioFile.isEmpty()) {
            return null;
        }

        return cloudinaryService.uploadFile(audioFile, "learning-app/speaking/audio");
    }

    private String resolveTranscript(String transcriptText) {
        if (transcriptText != null && !transcriptText.isBlank()) {
            return transcriptText.trim();
        }

        throw new AppException(ErrorCode.INVALID_REQUEST, "Transcript text is required");
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

    private void maybeCompleteLesson(User user, Question question) {
        Long lessonId = resolveLessonId(question);
        if (lessonId == null) {
            return;
        }

        long totalQuestions = historyRepo.countQuestionsByLessonId(lessonId);
        if (totalQuestions == 0) {
            return;
        }

        long answeredQuestions = historyRepo.countAnsweredQuestionsByUserAndLesson(user.getId(), lessonId);
        if (answeredQuestions < totalQuestions) {
            return;
        }

        long correctQuestions = historyRepo.countCorrectQuestionsByUserAndLesson(user.getId(), lessonId);
        double accuracy = (correctQuestions * 100.0) / totalQuestions;
        double score = accuracy / 10.0;

        learningProgressService.completeLesson(new com.ie303.uifive.dto.req.UserLessonProgressRequest(lessonId, score, accuracy));
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
}
