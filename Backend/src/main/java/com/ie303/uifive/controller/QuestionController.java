package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.QuestionRequest;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.LessonQuestionResponse;
import com.ie303.uifive.dto.res.QuestionResponse;
import com.ie303.uifive.service.QuestionService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.ModelAttribute;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RolesAllowed("ADMIN")
    public ApiResponse<QuestionResponse> create(@ModelAttribute @Valid QuestionRequest request) {
        return ApiResponse.<QuestionResponse>builder()
                .code(1000)
                .result(questionService.create(request))
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<QuestionResponse> getById(@PathVariable Long id) {
        return ApiResponse.<QuestionResponse>builder()
                .code(1000)
                .result(questionService.getById(id))
                .build();
    }

    @GetMapping
    public ApiResponse<List<QuestionResponse>> getAll() {
        return ApiResponse.<List<QuestionResponse>>builder()
                .code(1000)
                .result(questionService.getAll())
                .build();
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RolesAllowed("ADMIN")
    public ApiResponse<QuestionResponse> update(@PathVariable Long id,
                                                @ModelAttribute @Valid QuestionRequest request) {
        return ApiResponse.<QuestionResponse>builder()
                .code(1000)
                .result(questionService.update(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    @RolesAllowed("ADMIN")
    public ApiResponse<String> delete(@PathVariable Long id) {
        questionService.delete(id);
        return ApiResponse.<String>builder()
                .code(1000)
                .message("Deleted question")
                .result("Deleted question with id: " + id)
                .build();
    }

    @GetMapping("/lesson/{lessonId}")
    public ApiResponse<LessonQuestionResponse> getQuestionsByLesson(@PathVariable Long lessonId) {
        return ApiResponse.<LessonQuestionResponse>builder()
                .code(1000)
                .result(questionService.getQuestionsByLesson(lessonId))
                .build();
    }
}
