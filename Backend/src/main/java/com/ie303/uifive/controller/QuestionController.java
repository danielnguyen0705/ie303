package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.QuestionRequest;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.QuestionResponse;
import com.ie303.uifive.service.QuestionService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    @PostMapping
    @RolesAllowed("ADMIN")
    public QuestionResponse create(@RequestBody @Valid QuestionRequest request) {
        return questionService.create(request);
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

    @PutMapping("/{id}")
    @RolesAllowed("ADMIN")
    public QuestionResponse update(@PathVariable Long id,
                                   @RequestBody @Valid QuestionRequest request) {
        return questionService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @RolesAllowed("ADMIN")
    public String delete(@PathVariable Long id) {
        questionService.delete(id);
        return "Deleted question with id: " + id;
    }
}