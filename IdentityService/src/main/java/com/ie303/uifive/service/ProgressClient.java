package com.ie303.uifive.service;

import com.ie303.uifive.dto.res.AILearningAnalysisResponse;
import com.ie303.uifive.dto.res.StudyingGradeResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(
        name = "progress-service",
        url = "${progress.service.base-url:http://localhost:8087}"
)
public interface ProgressClient {

    @GetMapping("/internal/users/{username}/studying-grades")
    List<StudyingGradeResponse> getStudyingGrades(@PathVariable("username") String username);

    @GetMapping("/internal/learning-analysis/users/{username}/latest")
    AILearningAnalysisResponse getLatestLearningAnalysis(@PathVariable("username") String username);
}
