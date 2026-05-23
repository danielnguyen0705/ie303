package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.LessonRequest;
import com.ie303.uifive.dto.req.ReviewCreationRequest;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.LessonResponse;
import com.ie303.uifive.service.LessonService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/lessons")
@RequiredArgsConstructor
@RolesAllowed({"USER", "ADMIN"})
public class LessonController {

    private final LessonService lessonService;

    @PostMapping
    @RolesAllowed("ADMIN")
    public ApiResponse<LessonResponse> create(@RequestBody @Valid LessonRequest request) {
        return ApiResponse.<LessonResponse>builder().code(1000).result(lessonService.create(request)).build();
    }

    @GetMapping("/{id}")
    public ApiResponse<LessonResponse> getById(@PathVariable Long id) {
        return ApiResponse.<LessonResponse>builder().code(1000).result(lessonService.getById(id)).build();
    }

    @GetMapping
    public ApiResponse<List<LessonResponse>> getAll() {
        return ApiResponse.<List<LessonResponse>>builder().code(1000).result(lessonService.getAll()).build();
    }

    @PutMapping("/{id}")
    @RolesAllowed("ADMIN")
    public ApiResponse<LessonResponse> update(@PathVariable Long id, @RequestBody @Valid LessonRequest request) {
        return ApiResponse.<LessonResponse>builder().code(1000).result(lessonService.update(id, request)).build();
    }

    @DeleteMapping("/{id}")
    @RolesAllowed("ADMIN")
    public ApiResponse<String> delete(@PathVariable Long id) {
        lessonService.delete(id);
        return ApiResponse.<String>builder().code(1000).message("Deleted lesson").result("Deleted lesson with id: " + id).build();
    }

    @PostMapping("/{id}/create-review")
    @RolesAllowed("ADMIN")
    public ApiResponse<LessonResponse> createReview(@PathVariable Long id, @RequestBody ReviewCreationRequest request) {
        return ApiResponse.<LessonResponse>builder().code(1000).result(lessonService.createReviewFromLesson(id, request)).build();
    }
}
