package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.SubmitEssayImageRequest;
import com.ie303.uifive.dto.res.WritingEvaluationResponse;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.repo.AIWritingEvalutionRepo;
import com.ie303.uifive.repo.QuestionRepo;
import com.ie303.uifive.repo.UserQuestionHistoryRepo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EssayServiceTest {

    @Mock
    private QuestionRepo questionRepo;

    @Mock
    private UserQuestionHistoryRepo historyRepo;

    @Mock
    private AIWritingEvalutionRepo evaluationRepo;

    @Mock
    private AiGenerationService aiGenerationService;

    @Mock
    private CloudinaryService cloudinaryService;

    @InjectMocks
    private EssayService essayService;

    @Test
    void submitEssayWithImage_ShouldUploadImageAndEvaluate() {
        User vipUser = new User();
        vipUser.setId(11L);
        vipUser.setRole(Role.USER);
        vipUser.setVipExpiredAt(LocalDateTime.now().plusDays(1));
        vipUser.setCoin(0);
        vipUser.setScore(0);
        vipUser.setExp(0);

        Question question = new Question();
        question.setId(101L);
        question.setContent("Describe your favorite hobby.");
        question.setExplanation("Talk about why you like it and how often you do it.");

        MockMultipartFile imageFile = new MockMultipartFile(
                "imageFile",
                "answer.png",
                "image/png",
                new byte[]{1, 2, 3}
        );

        SubmitEssayImageRequest request = new SubmitEssayImageRequest(
                101L,
                "My hobby is reading books.",
                null,
                imageFile
        );

        when(questionRepo.findById(101L)).thenReturn(Optional.of(question));
        when(cloudinaryService.uploadFile(imageFile, "learning-app/essays/images"))
                .thenReturn("https://cloudinary.test/answer.png");
        when(aiGenerationService.evaluateEssay(eq(question.getContent()), eq(question.getExplanation()), eq(request.answerText()), eq("https://cloudinary.test/answer.png")))
                .thenReturn(new WritingEvaluationResponse(8.5, "Good essay"));

        WritingEvaluationResponse result = essayService.submitEssayWithImage(vipUser, request);

        verify(cloudinaryService).uploadFile(imageFile, "learning-app/essays/images");
        verify(aiGenerationService).evaluateEssay(eq(question.getContent()), eq(question.getExplanation()), eq(request.answerText()), eq("https://cloudinary.test/answer.png"));
        verify(evaluationRepo).save(any());
        verify(historyRepo).save(any());
    }
}
