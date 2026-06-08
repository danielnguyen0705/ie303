package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.SubmitEssayRequest;
import com.ie303.uifive.dto.req.SubmitEssayImageRequest;
import com.ie303.uifive.dto.req.UserQuestionHistoryRequest;
import com.ie303.uifive.dto.res.WritingEvaluationResponse;
import com.ie303.uifive.entity.AIWritingEvaluation;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.client.ContentServiceClient;
import com.ie303.uifive.client.ProgressServiceClient;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.repo.AIWritingEvalutionRepo;
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
    private final AIWritingEvalutionRepo evaluationRepo;
    private final AiGenerationService aiGenerationService;
    private final CloudinaryService cloudinaryService;
    private final ContentServiceClient contentServiceClient;
    private final ProgressServiceClient progressServiceClient;

    public WritingEvaluationResponse submitEssay(User user, SubmitEssayRequest request) {
        if (user.getVipExpiredAt() == null || !user.getVipExpiredAt().isAfter(LocalDateTime.now())) {
            throw new AppException(ErrorCode.VIP_REQUIRED);
        }

        var question = contentServiceClient.getQuestion(request.questionId());

        WritingEvaluationResponse aiResult = aiGenerationService.evaluateEssay(
                question.content(),
                question.explanation(),
                request.answerText()
        );

        progressServiceClient.submitQuestionHistory(new UserQuestionHistoryRequest(
                request.questionId(),
                request.answerText()
        ));

        AIWritingEvaluation evaluation = evaluationRepo
                .findByUserIdAndQuestionId(user.getId(), request.questionId())
                .orElseGet(AIWritingEvaluation::new);
        evaluation.setUserId(user.getId());
        evaluation.setQuestionId(request.questionId());
        evaluation.setAiScore(aiResult.score());
        evaluation.setAiFeedback(aiResult.feedback());

        evaluationRepo.save(evaluation);

        return aiResult;
    }

    public WritingEvaluationResponse submitEssayWithImage(User user, SubmitEssayImageRequest request) {
        if (user.getVipExpiredAt() == null || !user.getVipExpiredAt().isAfter(LocalDateTime.now())) {
            throw new AppException(ErrorCode.VIP_REQUIRED);
        }

        var question = contentServiceClient.getQuestion(request.questionId());

        String imageUrl = resolveImageUrl(request.imageFile(), request.imageUrl());
        String answerText = request.answerText() == null ? "" : request.answerText().trim();

        WritingEvaluationResponse aiResult = aiGenerationService.evaluateEssay(
                question.content(),
                question.explanation(),
                answerText,
                imageUrl
        );

        progressServiceClient.submitQuestionHistory(new UserQuestionHistoryRequest(
                request.questionId(),
                answerText
        ));

        AIWritingEvaluation evaluation = evaluationRepo
                .findByUserIdAndQuestionId(user.getId(), request.questionId())
                .orElseGet(AIWritingEvaluation::new);
        evaluation.setUserId(user.getId());
        evaluation.setQuestionId(request.questionId());
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
