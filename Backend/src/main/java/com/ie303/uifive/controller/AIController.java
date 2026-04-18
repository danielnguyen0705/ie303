package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.SubmitEssayRequest;
import com.ie303.uifive.dto.req.PersonalizedQuestionRequest;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.QuestionResponse;
import com.ie303.uifive.dto.res.WritingEvaluationResponse;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.service.EssayService;
import com.ie303.uifive.service.PersonalizedPracticeService;
import com.ie303.uifive.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final EssayService essayService;
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

    @PostMapping("/personalized-questions")
        public ApiResponse<List<QuestionResponse>> generatePersonalizedQuestions(
            @RequestBody PersonalizedQuestionRequest request,
            Authentication authentication
    ) {
        String username = authentication.getName();
        User user = userService.getByUsername(username);

                List<QuestionResponse> result = personalizedPracticeService.generateFromWrongQuestions(request);

                return ApiResponse.<List<QuestionResponse>>builder()
                .code(1000)
                .message("Generated personalized questions successfully")
                .result(result)
                .build();
    }
}
