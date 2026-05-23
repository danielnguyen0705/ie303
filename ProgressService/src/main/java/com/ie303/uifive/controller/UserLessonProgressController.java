package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.UserLessonProgressRequest;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.LessonProgressResponse;
import com.ie303.uifive.dto.res.SectionProgressResponse;
import com.ie303.uifive.dto.res.UnitProgressResponse;
import com.ie303.uifive.dto.res.UserLessonProgressResponse;
import com.ie303.uifive.service.LearningProgressService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
@RolesAllowed({"USER", "ADMIN"})
public class UserLessonProgressController {

    private final LearningProgressService learningProgressService;

    @PostMapping("/lessons/complete")
    public ApiResponse<UserLessonProgressResponse> completeLesson(@RequestBody @Valid UserLessonProgressRequest request) {
        return ApiResponse.<UserLessonProgressResponse>builder()
                .code(1000)
                .message("Lesson completion saved")
                .result(learningProgressService.completeLesson(request))
                .build();
    }

    @GetMapping("/grades/{gradeId}/units")
    public ApiResponse<List<UnitProgressResponse>> getUnitsByGrade(@PathVariable Long gradeId) {
        return ApiResponse.<List<UnitProgressResponse>>builder()
                .code(1000)
                .result(learningProgressService.getUnitsByGrade(gradeId))
                .build();
    }

    @GetMapping("/units/{unitId}/sections")
    public ApiResponse<List<SectionProgressResponse>> getSectionsByUnit(@PathVariable Long unitId) {
        return ApiResponse.<List<SectionProgressResponse>>builder()
                .code(1000)
                .result(learningProgressService.getSectionsByUnit(unitId))
                .build();
    }

    @GetMapping("/sections/{sectionId}/lessons")
    public ApiResponse<List<LessonProgressResponse>> getLessonsBySection(@PathVariable Long sectionId) {
        return ApiResponse.<List<LessonProgressResponse>>builder()
                .code(1000)
                .result(learningProgressService.getLessonsBySection(sectionId))
                .build();
    }

    @GetMapping("/sections/{sectionId}/review-lessons")
    public ApiResponse<List<LessonProgressResponse>> getReviewLessonsBySection(@PathVariable Long sectionId) {
        return ApiResponse.<List<LessonProgressResponse>>builder()
                .code(1000)
                .result(learningProgressService.getReviewLessonsBySection(sectionId))
                .build();
    }
}
