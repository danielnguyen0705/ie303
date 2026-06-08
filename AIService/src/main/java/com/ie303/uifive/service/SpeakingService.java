package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.SubmitSpeakingRequest;
import com.ie303.uifive.dto.req.UserLessonProgressRequest;
import com.ie303.uifive.dto.req.UserQuestionHistoryRequest;
import com.ie303.uifive.dto.res.SpeakingEvaluationResponse;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.client.ContentServiceClient;
import com.ie303.uifive.client.ProgressServiceClient;
import com.ie303.uifive.dto.res.QuestionGroupResponse;
import com.ie303.uifive.dto.res.QuestionResponse;
import com.ie303.uifive.entity.AISpeakingEvaluation;
import com.ie303.uifive.entity.QuestionType;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.repo.AISpeakingEvaluationRepo;
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

    private final AISpeakingEvaluationRepo evaluationRepo;
    private final UserRepo userRepo;
    private final UserService userService;
    private final AiGenerationService aiGenerationService;
    private final CloudinaryService cloudinaryService;
    private final ContentServiceClient contentServiceClient;
    private final ProgressServiceClient progressServiceClient;

    public SpeakingEvaluationResponse submitSpeaking(User user, SubmitSpeakingRequest request) {
        QuestionResponse question = contentServiceClient.getQuestion(request.questionId());

        if (question.questionType() != QuestionType.PRONUNCIATION
                && question.questionType() != QuestionType.TOPIC_SPEAKING) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Question is not a speaking question");
        }

        String audioUrl = resolveAudioUrl(request.audioFile());
        String transcriptText = resolveTranscript(request.transcriptText());
        SpeakingEvaluationResponse aiResult = aiGenerationService.evaluateSpeaking(
                question.content(),
                question.explanation(),
                transcriptText
        );

        User current = userRepo.findById(user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        userService.touchStudyStreak(current.getId());
        current = userRepo.findById(user.getId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        progressServiceClient.submitQuestionHistory(new UserQuestionHistoryRequest(
                request.questionId(),
                transcriptText
        ));

        if (aiResult.score() >= 5.0) {
            current.setCoin(current.getCoin() + QUESTION_CORRECT_COIN_REWARD);
            current.setScore(current.getScore() + QUESTION_CORRECT_SCORE_REWARD);
            int expEarned = calculateExpReward(current);
            current.setExp(current.getExp() + expEarned);
            userRepo.save(current);
        }

        saveSpeakingEvaluation(current, request.questionId(), audioUrl, transcriptText, aiResult);
        maybeCompleteLesson(current, question);

        return new SpeakingEvaluationResponse(aiResult.score(), aiResult.feedback(), transcriptText, audioUrl);
    }

    private void saveSpeakingEvaluation(User user,
                                        Long questionId,
                                        String audioUrl,
                                        String transcriptText,
                                        SpeakingEvaluationResponse aiResult) {
        AISpeakingEvaluation evaluation = evaluationRepo
                .findByUserIdAndQuestionId(user.getId(), questionId)
                .orElseGet(AISpeakingEvaluation::new);
        evaluation.setUserId(user.getId());
        evaluation.setQuestionId(questionId);
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

    private void maybeCompleteLesson(User user, QuestionResponse question) {
        Long lessonId = resolveLessonId(question);
        if (lessonId == null) {
            return;
        }

        var lessonQuestions = contentServiceClient.getQuestionsByLesson(lessonId);
        long totalQuestions = lessonQuestions.singleQuestions().size();
        if (lessonQuestions.questionGroups() != null) {
            totalQuestions += lessonQuestions.questionGroups().stream()
                    .mapToLong(group -> group.questions() == null ? 0 : group.questions().size())
                    .sum();
        }

        if (totalQuestions == 0) {
            return;
        }

        double accuracy = 100.0;
        double score = accuracy / 10.0;

        progressServiceClient.completeLesson(new UserLessonProgressRequest(lessonId, score, accuracy));
    }

    private Long resolveLessonId(QuestionResponse question) {
        if (question.lessonId() != null) {
            return question.lessonId();
        }

        if (question.questionGroupId() != null) {
            QuestionGroupResponse group = contentServiceClient.getQuestionGroup(question.questionGroupId());
            return group.lessonId();
        }

        return null;
    }
}
