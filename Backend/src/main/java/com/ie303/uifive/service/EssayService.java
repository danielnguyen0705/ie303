package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.SubmitEssayRequest;
import com.ie303.uifive.dto.res.WritingEvaluationResponse;
import com.ie303.uifive.entity.AIWritingEvaluation;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.entity.UserQuestionHistory;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.repo.AIWritingEvalutionRepo;
import com.ie303.uifive.repo.LessonRepo;
import com.ie303.uifive.repo.QuestionRepo;
import com.ie303.uifive.repo.UserQuestionHistoryRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EssayService {
    private final QuestionRepo questionRepo;
    private final UserQuestionHistoryRepo historyRepo;
    private final AIWritingEvalutionRepo evaluationRepo;
    private final GeminiService geminiService;

    public WritingEvaluationResponse submitEssay(User user, SubmitEssayRequest request) {
        Question question = questionRepo.findById(request.questionId())
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));

        // 1. Lưu bài user vào history
        UserQuestionHistory history = new UserQuestionHistory();
        history.setUser(user);
        history.setQuestion(question);
        history.setAnswerText(request.answerText());
        history.setCorrect(true);
        history = historyRepo.save(history);

        // 2. Gọi AI chấm
        WritingEvaluationResponse aiResult = geminiService.evaluateEssay(
                question.getContent(),
                question.getExplanation(),
                request.answerText()
        );

        // 3. Lưu kết quả AI
        AIWritingEvaluation evaluation = new AIWritingEvaluation();
        evaluation.setUser(user);
        evaluation.setQuestion(question);
        evaluation.setAiScore(aiResult.score());
        evaluation.setAiFeedback(aiResult.feedback());

        evaluationRepo.save(evaluation);

        return aiResult;
    }
}
