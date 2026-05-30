package com.ie303.uifive.controller;

import com.ie303.uifive.dto.res.AILearningAnalysisResponse;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.MLPredictionResponse;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.service.LearningAnalysisService;
import com.ie303.uifive.service.UserService;
import jakarta.annotation.security.RolesAllowed;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class LearningAnalysisController {

    private final LearningAnalysisService learningAnalysisService;
    private final UserService userService;

    @PostMapping("/internal/learning-analysis/users/{userId}")
    public void saveAnalysis(@PathVariable Long userId, @RequestBody MLPredictionResponse response) {
        learningAnalysisService.saveAnalysis(userId, response);
    }

    @GetMapping("/internal/learning-analysis/users/{username}/latest")
    public AILearningAnalysisResponse getLatestByUsernameInternal(@PathVariable String username) {
        return learningAnalysisService.getLatestByUsername(username);
    }

    @GetMapping("/internal/learning-analysis/users/{username}/history")
    public List<AILearningAnalysisResponse> getHistoryByUsernameInternal(@PathVariable String username) {
        return learningAnalysisService.getHistoryByUsername(username);
    }

    @GetMapping("/api/ai/learning-analysis/me")
    @RolesAllowed({"USER", "ADMIN"})
    public ApiResponse<AILearningAnalysisResponse> getLatestLearningAnalysis() {
        User user = userService.getCurrentUser();
        AILearningAnalysisResponse result = learningAnalysisService.getLatestByUsername(user.getUsername());

        return ApiResponse.<AILearningAnalysisResponse>builder()
                .code(1000)
                .message(result == null ? "No learning analysis available yet" : "Fetched latest learning analysis successfully")
                .result(result)
                .build();
    }

    @PostMapping("/api/ai/learning-analysis/me/refresh")
    @RolesAllowed({"USER", "ADMIN"})
    public ApiResponse<AILearningAnalysisResponse> refreshLearningAnalysis() {
        AILearningAnalysisResponse result = learningAnalysisService.refreshAnalysis();

        return ApiResponse.<AILearningAnalysisResponse>builder()
                .code(1000)
                .message(result == null ? "No learning analysis available yet" : "Refreshed learning analysis successfully")
                .result(result)
                .build();
    }

    @GetMapping("/api/ai/learning-analysis/me/history")
    @RolesAllowed({"USER", "ADMIN"})
    public ApiResponse<List<AILearningAnalysisResponse>> getLearningAnalysisHistory() {
        User user = userService.getCurrentUser();
        List<AILearningAnalysisResponse> result = learningAnalysisService.getHistoryByUsername(user.getUsername());

        return ApiResponse.<List<AILearningAnalysisResponse>>builder()
                .code(1000)
                .message("Fetched learning analysis history successfully")
                .result(result)
                .build();
    }
}
