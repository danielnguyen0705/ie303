package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.SubmitSpeakingRequest;
import com.ie303.uifive.dto.res.SpeakingEvaluationResponse;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.entity.QuestionType;
import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.repo.AISpeakingEvaluationRepo;
import com.ie303.uifive.repo.QuestionRepo;
import com.ie303.uifive.repo.UserQuestionHistoryRepo;
import com.ie303.uifive.repo.UserRepo;
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
class SpeakingServiceTest {

    @Mock
    private QuestionRepo questionRepo;

    @Mock
    private UserQuestionHistoryRepo historyRepo;

    @Mock
    private AISpeakingEvaluationRepo evaluationRepo;

    @Mock
    private UserRepo userRepo;

    @Mock
    private UserService userService;

    @Mock
    private LearningProgressService learningProgressService;

    @Mock
    private AiGenerationService aiGenerationService;

    @Mock
    private CloudinaryService cloudinaryService;

    @InjectMocks
    private SpeakingService speakingService;

    @Test
    void submitSpeaking_ShouldEvaluateTranscriptAndStoreAudio() {
        User user = new User();
        user.setId(21L);
        user.setRole(Role.USER);
        user.setVipExpiredAt(LocalDateTime.now().plusDays(1));
        user.setCoin(0);
        user.setScore(0);
        user.setExp(0);

        Question question = new Question();
        question.setId(201L);
        question.setQuestionType(QuestionType.TOPIC_SPEAKING);
        question.setContent("Talk about your family.");
        question.setExplanation("Mention members and what they like.");

        MockMultipartFile audioFile = new MockMultipartFile(
                "audioFile",
                "answer.mp3",
                "audio/mpeg",
                new byte[]{4, 5, 6}
        );

        SubmitSpeakingRequest request = new SubmitSpeakingRequest(201L, "My family has four members.", audioFile);

        when(questionRepo.findById(201L)).thenReturn(Optional.of(question));
        when(userRepo.findById(21L)).thenReturn(Optional.of(user));
        when(userRepo.save(user)).thenReturn(user);
        when(cloudinaryService.uploadFile(audioFile, "learning-app/speaking/audio"))
                .thenReturn("https://cloudinary.test/answer.mp3");
        when(aiGenerationService.evaluateSpeaking(eq(question.getContent()), eq(question.getExplanation()), eq("My family has four members.")))
                .thenReturn(new SpeakingEvaluationResponse(7.5, "Clear and relevant", "My family has four members.", null));

        SpeakingEvaluationResponse result = speakingService.submitSpeaking(user, request);

        verify(userService).touchStudyStreak(21L);
        verify(cloudinaryService).uploadFile(audioFile, "learning-app/speaking/audio");
        verify(aiGenerationService).evaluateSpeaking(eq(question.getContent()), eq(question.getExplanation()), eq("My family has four members."));
        verify(historyRepo).save(any());
        verify(evaluationRepo).save(any());
    }
}
