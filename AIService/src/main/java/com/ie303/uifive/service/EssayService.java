package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.SubmitEssayRequest;
import com.ie303.uifive.dto.req.SubmitEssayImageRequest;
import com.ie303.uifive.dto.res.WritingEvaluationResponse;
import com.ie303.uifive.entity.AIWritingEvaluation;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.entity.UserQuestionHistory;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.repo.AIWritingEvalutionRepo;
import com.ie303.uifive.repo.QuestionRepo;
import com.ie303.uifive.repo.UserQuestionHistoryRepo;
import com.ie303.uifive.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class EssayService {
    private final QuestionRepo questionRepo;
    private final UserQuestionHistoryRepo historyRepo;
    private final AIWritingEvalutionRepo evaluationRepo;
    private final AiGenerationService aiGenerationService;
    private final CloudinaryService cloudinaryService;

    public WritingEvaluationResponse submitEssay(User user, SubmitEssayRequest request) {
        if (user.getVipExpiredAt() == null || !user.getVipExpiredAt().isAfter(LocalDateTime.now())) {
            throw new AppException(ErrorCode.VIP_REQUIRED);
        }

        Question question = questionRepo.findById(request.questionId())
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));

        WritingEvaluationResponse aiResult = aiGenerationService.evaluateEssay(
                question.getContent(),
                question.getExplanation(),
                request.answerText()
        );

        UserQuestionHistory history = new UserQuestionHistory();
        history.setUser(user);
        history.setQuestion(question);
        history.setAnswerText(request.answerText());
        history.setCorrect(aiResult.score() >= 5.0);
        historyRepo.save(history);

        AIWritingEvaluation evaluation = evaluationRepo
                .findByUserIdAndQuestionId(user.getId(), question.getId())
                .orElseGet(AIWritingEvaluation::new);
        evaluation.setUser(user);
        evaluation.setQuestion(question);
        evaluation.setAiScore(aiResult.score());
        evaluation.setAiFeedback(aiResult.feedback());

        evaluationRepo.save(evaluation);

        return aiResult;
    }

    public WritingEvaluationResponse submitEssayWithImage(User user, SubmitEssayImageRequest request) {
        if (user.getVipExpiredAt() == null || !user.getVipExpiredAt().isAfter(LocalDateTime.now())) {
            throw new AppException(ErrorCode.VIP_REQUIRED);
        }

        Question question = questionRepo.findById(request.questionId())
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));

        String imageUrl = resolveImageUrl(request.imageFile(), request.imageUrl());
        String answerText = request.answerText() == null ? "" : request.answerText().trim();

        WritingEvaluationResponse aiResult = aiGenerationService.evaluateEssay(
                question.getContent(),
                question.getExplanation(),
                answerText,
                imageUrl
        );

        UserQuestionHistory history = new UserQuestionHistory();
        history.setUser(user);
        history.setQuestion(question);
        history.setAnswerText(answerText);
        history.setCorrect(aiResult.score() >= 5.0);
        historyRepo.save(history);

        AIWritingEvaluation evaluation = evaluationRepo
                .findByUserIdAndQuestionId(user.getId(), question.getId())
                .orElseGet(AIWritingEvaluation::new);
        evaluation.setUser(user);
        evaluation.setQuestion(question);
        evaluation.setAiScore(aiResult.score());
        evaluation.setAiFeedback(aiResult.feedback());
        evaluation.setImageUrl(imageUrl);

        evaluationRepo.save(evaluation);

        return aiResult;
    }

    private String resolveImageUrl(MultipartFile imageFile, String imageUrl) {
        if (imageFile != null && !imageFile.isEmpty()) {
            return cloudinaryService.uploadFile(imageFile, "learning-app/essays/images");
        }

        if (imageUrl != null && !imageUrl.isBlank()) {
            return imageUrl.trim();
        }

        return null;
    }
}
