package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.SubmitEssayRequest;
import com.ie303.uifive.dto.req.SubmitEssayImageRequest;
import com.ie303.uifive.dto.req.SubmitSpeakingRequest;
import com.ie303.uifive.dto.req.PersonalizedQuestionRequest;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.QuestionResponse;
import com.ie303.uifive.dto.res.WritingEvaluationResponse;
import com.ie303.uifive.dto.res.SpeakingEvaluationResponse;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.service.EssayService;
import com.ie303.uifive.service.PersonalizedPracticeService;
import com.ie303.uifive.service.SpeakingService;
import com.ie303.uifive.service.UserService;
import jakarta.annotation.security.RolesAllowed;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@RolesAllowed({"USER", "ADMIN"})
public class AIController {

    private final EssayService essayService;
    private final SpeakingService speakingService;
    private final PersonalizedPracticeService personalizedPracticeService;
    private final UserService userService;

    @PostMapping("/essay/submit")
    public ApiResponse<WritingEvaluationResponse> submitEssay(
            @RequestBody SubmitEssayRequest request,
            Authentication authentication
    ){
        String username = authentication.getName();
        User user = userService.getByUsername(username);

        WritingEvaluationResponse result = essayService.submitEssay(user, request);

        return ApiResponse.<WritingEvaluationResponse>builder()
                .code(1000)
                .message("Submit essay successfully")
                .result(result)
                .build();
    }

    @PostMapping(value = "/essay/submit-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<WritingEvaluationResponse> submitEssayWithImage(
            @ModelAttribute SubmitEssayImageRequest request,
            Authentication authentication
    ) {
        String username = authentication.getName();
        User user = userService.getByUsername(username);

        WritingEvaluationResponse result = essayService.submitEssayWithImage(user, request);

        return ApiResponse.<WritingEvaluationResponse>builder()
                .code(1000)
                .message("Submit essay with image successfully")
                .result(result)
                .build();
    }

    @PostMapping(value = "/speaking/submit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<SpeakingEvaluationResponse> submitSpeaking(
            @ModelAttribute SubmitSpeakingRequest request,
            Authentication authentication
    ) {
        String username = authentication.getName();
        User user = userService.getByUsername(username);

        SpeakingEvaluationResponse result = speakingService.submitSpeaking(user, request);

        return ApiResponse.<SpeakingEvaluationResponse>builder()
                .code(1000)
                .message("Submit speaking successfully")
                .result(result)
                .build();
    }

    @PostMapping("/personalized-questions")
    public ApiResponse<List<QuestionResponse>> generatePersonalizedQuestions(
            @RequestBody PersonalizedQuestionRequest request
    ) {
        List<QuestionResponse> result = personalizedPracticeService.generateFromWrongQuestions(request);

        return ApiResponse.<List<QuestionResponse>>builder()
                .code(1000)
                .message("Generated personalized questions successfully")
                .result(result)
                .build();
    }
}
