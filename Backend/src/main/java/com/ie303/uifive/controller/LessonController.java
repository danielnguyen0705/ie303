package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.LessonRequest;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.LessonResponse;
import com.ie303.uifive.service.LessonService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lessons")
@RequiredArgsConstructor
public class LessonController {

    private final LessonService lessonService;

    @PostMapping
    @RolesAllowed("ADMIN")
    public LessonResponse create(@RequestBody @Valid LessonRequest request) {
        return lessonService.create(request);
    }

    @GetMapping("/{id}")
    public ApiResponse<LessonResponse> getById(@PathVariable Long id) {
        return ApiResponse.<LessonResponse>builder()
                .code(1000)
                .result(lessonService.getById(id))
                .build();
    }

    @GetMapping
    public ApiResponse<List<LessonResponse>> getAll() {
        return ApiResponse.<List<LessonResponse>>builder()
                .code(1000)
                .result(lessonService.getAll())
                .build();
    }

    @PutMapping("/{id}")
    @RolesAllowed("ADMIN")
    public LessonResponse update(@PathVariable Long id,
                                 @RequestBody @Valid LessonRequest request) {
        return lessonService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @RolesAllowed("ADMIN")
    public String delete(@PathVariable Long id) {
        lessonService.delete(id);
        return "Deleted lesson with id: " + id;
    }
}