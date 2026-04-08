package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.UserLessonProgressRequest;
import com.ie303.uifive.dto.res.*;
import com.ie303.uifive.service.LearningProgressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class UserLessonProgressController {

    private final LearningProgressService learningProgressService;

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
}