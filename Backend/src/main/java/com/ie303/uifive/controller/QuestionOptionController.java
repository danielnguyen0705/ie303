package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.QuestionOptionRequest;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.QuestionOptionResponse;
import com.ie303.uifive.service.QuestionOptionService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/question-options")
@RequiredArgsConstructor
public class
QuestionOptionController {

    private final QuestionOptionService service;

    @PostMapping
    @RolesAllowed("ADMIN")
    public ApiResponse<QuestionOptionResponse> create(@RequestBody @Valid QuestionOptionRequest request) {
        return ApiResponse.<QuestionOptionResponse>builder()
                .code(1000)
                .result(service.create(request))
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<QuestionOptionResponse> getById(@PathVariable Long id) {
        return ApiResponse.<QuestionOptionResponse>builder()
                .code(1000)
                .result(service.getById(id))
                .build();
    }

    @GetMapping
    public ApiResponse<List<QuestionOptionResponse>> getAll() {
        return ApiResponse.<List<QuestionOptionResponse>>builder()
                .code(1000)
                .result(service.getAll())
                .build();
    }

    @PutMapping("/{id}")
    @RolesAllowed("ADMIN")
    public ApiResponse<QuestionOptionResponse> update(@PathVariable Long id,
                                                      @RequestBody @Valid QuestionOptionRequest request) {
        return ApiResponse.<QuestionOptionResponse>builder()
                .code(1000)
                .result(service.update(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    @RolesAllowed("ADMIN")
    public ApiResponse<String> delete(@PathVariable Long id) {
        service.delete(id);
        return ApiResponse.<String>builder()
                .code(1000)
                .message("Deleted question option")
                .result("Deleted question option with id: " + id)
                .build();
    }
}