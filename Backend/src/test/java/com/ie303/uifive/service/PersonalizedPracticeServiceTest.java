package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.PersonalizedQuestionRequest;
import com.ie303.uifive.dto.res.QuestionResponse;
import com.ie303.uifive.dto.res.QuestionOptionResponse;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.entity.QuestionOption;
import com.ie303.uifive.entity.QuestionType;
import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.mapper.QuestionMapper;
import com.ie303.uifive.repo.QuestionOptionRepo;
import com.ie303.uifive.repo.QuestionRepo;
import com.ie303.uifive.repo.UserQuestionHistoryRepo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PersonalizedPracticeServiceTest {

    @Mock
    private UserService userService;

    @Mock
    private UserQuestionHistoryRepo userQuestionHistoryRepo;

    @Mock
    private AiGenerationService aiGenerationService;

    @Mock
    private QuestionRepo questionRepo;

    @Mock
    private QuestionOptionRepo questionOptionRepo;

    @Mock
    private QuestionMapper questionMapper;

    @InjectMocks
    private PersonalizedPracticeService personalizedPracticeService;

    @Test
    void generateFromWrongQuestions_ShouldPassResolvedTargetAnswerToAiContext() {
        User vipUser = new User();
        vipUser.setId(11L);
        vipUser.setRole(Role.USER);
        vipUser.setVipExpiredAt(LocalDateTime.now().plusDays(1));

        Question wrongQuestion = new Question();
        wrongQuestion.setId(101L);
        wrongQuestion.setQuestionType(QuestionType.QUALITATIVE_MC);
        wrongQuestion.setContent("Choose the correct word: She goes to the ___ every day.");
        wrongQuestion.setInstruction("Choose the best answer.");
        wrongQuestion.setQuestionData("{\"skill\":\"vocabulary\"}");
        wrongQuestion.setExplanation("school is the correct place noun in this sentence.");
        wrongQuestion.setCorrectAnswer("B");

        QuestionOption optionA = new QuestionOption();
        optionA.setOptionKey("A");
        optionA.setContent("market");
        optionA.setCorrect(false);

        QuestionOption optionB = new QuestionOption();
        optionB.setOptionKey("B");
        optionB.setContent("school");
        optionB.setCorrect(true);

        AiGenerationService.GeneratedMcqDraft generatedDraft = new AiGenerationService.GeneratedMcqDraft(
                "Choose the correct word: He walks to the school in the morning.",
                "school remains the target word from the wrong answer set.",
                "A",
                List.of(
                        new AiGenerationService.GeneratedMcqOptionDraft("A", "school"),
                        new AiGenerationService.GeneratedMcqOptionDraft("B", "park"),
                        new AiGenerationService.GeneratedMcqOptionDraft("C", "river"),
                        new AiGenerationService.GeneratedMcqOptionDraft("D", "bridge")
                )
        );

        AiGenerationService.GeneratedPersonalizedQuestionDraft personalizedDraft =
                new AiGenerationService.GeneratedPersonalizedQuestionDraft(
                        "QUALITATIVE_MC",
                        generatedDraft.content(),
                        generatedDraft.explanation(),
                        "A",
                        generatedDraft.options()
                );

        Question savedQuestion = new Question();
        savedQuestion.setId(202L);
        savedQuestion.setQuestionType(QuestionType.QUALITATIVE_MC);
        savedQuestion.setContent(generatedDraft.content());
        savedQuestion.setExplanation(generatedDraft.explanation());
        savedQuestion.setCorrectAnswer("A");

        QuestionResponse response = new QuestionResponse(
                202L,
                QuestionType.QUALITATIVE_MC,
                generatedDraft.content(),
                null,
                null,
                null,
                null,
                null,
                generatedDraft.explanation(),
                "A",
                null,
                null,
                List.<QuestionOptionResponse>of()
        );

        PersonalizedQuestionRequest request = new PersonalizedQuestionRequest(1, 5L, 2);

        when(userService.getCurrentUser()).thenReturn(vipUser);
        when(userQuestionHistoryRepo.findDistinctWrongQuestionIdsByUserAndGradeAndUnit(11L, 5L, 2))
                .thenReturn(List.of(101L));
        when(questionRepo.findAllById(List.of(101L))).thenReturn(List.of(wrongQuestion));
        when(questionOptionRepo.findByQuestionId(101L)).thenReturn(List.of(optionA, optionB));
        when(aiGenerationService.generatePersonalizedQuestions(any(), eq(1), eq((String) null)))
                .thenReturn(List.of(personalizedDraft));
        when(questionRepo.saveAll(any())).thenReturn(List.of(savedQuestion));
        when(questionMapper.toResponse(savedQuestion)).thenReturn(response);

        List<QuestionResponse> result = personalizedPracticeService.generateFromWrongQuestions(request);

        ArgumentCaptor<String> contextCaptor = ArgumentCaptor.forClass(String.class);
        verify(aiGenerationService).generatePersonalizedQuestions(contextCaptor.capture(), eq(1), eq((String) null));

        String context = contextCaptor.getValue();
        assertTrue(context.contains("Unit number: 2"));
        assertTrue(context.contains("targetAnswer: school"));
        assertTrue(context.contains("rawCorrectAnswer: B"));
        assertEquals(1, result.size());
        assertEquals(202L, result.get(0).id());
    }

    @Test
    void generateFromWrongQuestions_ShouldFallbackWhenDraftsDriftAwayFromTargetAnswer() {
        User vipUser = new User();
        vipUser.setId(11L);
        vipUser.setRole(Role.USER);
        vipUser.setVipExpiredAt(LocalDateTime.now().plusDays(1));

        Question wrongQuestion = new Question();
        wrongQuestion.setId(101L);
        wrongQuestion.setQuestionType(QuestionType.QUALITATIVE_MC);
        wrongQuestion.setContent("Choose the correct word: She goes to the ___ every day.");
        wrongQuestion.setCorrectAnswer("B");

        QuestionOption optionA = new QuestionOption();
        optionA.setOptionKey("A");
        optionA.setContent("market");
        optionA.setCorrect(false);

        QuestionOption optionB = new QuestionOption();
        optionB.setOptionKey("B");
        optionB.setContent("school");
        optionB.setCorrect(true);

        AiGenerationService.GeneratedPersonalizedQuestionDraft driftedDraft =
                new AiGenerationService.GeneratedPersonalizedQuestionDraft(
                        "QUALITATIVE_MC",
                        "Choose the correct word: He sits under the tree after class.",
                        "park is where he relaxes in this sentence.",
                        "C",
                        List.of(
                                new AiGenerationService.GeneratedMcqOptionDraft("A", "library"),
                                new AiGenerationService.GeneratedMcqOptionDraft("B", "museum"),
                                new AiGenerationService.GeneratedMcqOptionDraft("C", "park"),
                                new AiGenerationService.GeneratedMcqOptionDraft("D", "river")
                        )
                );

        PersonalizedQuestionRequest request = new PersonalizedQuestionRequest(1, 5L, 2);

        when(userService.getCurrentUser()).thenReturn(vipUser);
        when(userQuestionHistoryRepo.findDistinctWrongQuestionIdsByUserAndGradeAndUnit(11L, 5L, 2))
                .thenReturn(List.of(101L));
        when(questionRepo.findAllById(List.of(101L))).thenReturn(List.of(wrongQuestion));
        when(questionOptionRepo.findByQuestionId(101L)).thenReturn(List.of(optionA, optionB));
        when(aiGenerationService.generatePersonalizedQuestions(any(), eq(1), eq((String) null)))
                .thenReturn(List.of(driftedDraft));
        stubSaveAndMapQuestions();

        List<QuestionResponse> result = personalizedPracticeService.generateFromWrongQuestions(request);

        assertEquals(1, result.size());
        assertEquals("Choose the correct word: She goes to the ___ every day.", result.get(0).content());
        assertTrue(result.get(0).explanation().contains("Retry practice set generated"));
    }

    @Test
    void generateFromWrongQuestions_ShouldAutoScaleQuestionCountFromWrongHistoryAndFallbackWhenAiFails() {
        User vipUser = new User();
        vipUser.setId(11L);
        vipUser.setRole(Role.USER);
        vipUser.setVipExpiredAt(LocalDateTime.now().plusDays(1));

        List<Long> wrongQuestionIds = new ArrayList<>();
        List<Question> wrongQuestions = new ArrayList<>();

        for (long i = 1; i <= 10; i += 1) {
            wrongQuestionIds.add(100L + i);

            Question question = new Question();
            question.setId(100L + i);
            question.setQuestionType(QuestionType.QUALITATIVE_MC);
            question.setContent("Reference question " + i);
            question.setCorrectAnswer("A");
            wrongQuestions.add(question);

            QuestionOption correctOption = new QuestionOption();
            correctOption.setOptionKey("A");
            correctOption.setContent("target-" + i);
            correctOption.setCorrect(true);

            when(questionOptionRepo.findByQuestionId(100L + i)).thenReturn(List.of(correctOption));
        }

        PersonalizedQuestionRequest request = new PersonalizedQuestionRequest(null, 5L, 2);

        when(userService.getCurrentUser()).thenReturn(vipUser);
        when(userQuestionHistoryRepo.findDistinctWrongQuestionIdsByUserAndGradeAndUnit(11L, 5L, 2))
                .thenReturn(wrongQuestionIds);
        when(questionRepo.findAllById(wrongQuestionIds)).thenReturn(wrongQuestions);
        when(aiGenerationService.generatePersonalizedQuestions(any(), eq(20), eq((String) null)))
                .thenThrow(new AppException(com.ie303.uifive.exception.ErrorCode.AI_NOT_RESPONSE));
        stubSaveAndMapQuestions();

        List<QuestionResponse> result = personalizedPracticeService.generateFromWrongQuestions(request);

        verify(aiGenerationService).generatePersonalizedQuestions(any(), eq(20), eq((String) null));
        assertEquals(20, result.size());
    }

    private void stubSaveAndMapQuestions() {
        AtomicLong ids = new AtomicLong(1000L);

        when(questionRepo.saveAll(any())).thenAnswer(invocation -> {
            List<Question> questions = invocation.getArgument(0);
            questions.forEach(question -> question.setId(ids.incrementAndGet()));
            return questions;
        });

        when(questionMapper.toResponse(any())).thenAnswer(invocation -> {
            Question question = invocation.getArgument(0);
            List<QuestionOptionResponse> options = question.getOptions() == null
                    ? List.of()
                    : question.getOptions().stream()
                    .map(option -> new QuestionOptionResponse(
                            option.getId(),
                            option.getOptionKey(),
                            option.getContent(),
                            option.isCorrect()
                    ))
                    .toList();

            return new QuestionResponse(
                    question.getId(),
                    question.getQuestionType(),
                    question.getContent(),
                    question.getInstruction(),
                    question.getHint(),
                    question.getAudioUrl(),
                    question.getImageUrl(),
                    question.getQuestionData(),
                    question.getExplanation(),
                    question.getCorrectAnswer(),
                    null,
                    null,
                    options
            );
        });
    }
}
