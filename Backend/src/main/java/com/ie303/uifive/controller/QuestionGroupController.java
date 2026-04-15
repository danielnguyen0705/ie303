package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.QuestionGroupRequest;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.QuestionGroupResponse;
import com.ie303.uifive.service.QuestionGroupService;
import jakarta.annotation.security.RolesAllowed;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/question-groups")
@RequiredArgsConstructor
public class QuestionGroupController {

    private final QuestionGroupService questionGroupService;

    @PostMapping
    @RolesAllowed("ADMIN")
    public ApiResponse<QuestionGroupResponse> create(@RequestBody QuestionGroupRequest request) {
        return ApiResponse.<QuestionGroupResponse>builder()
                .code(1000)
                .result(questionGroupService.create(request))
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<QuestionGroupResponse> getById(@PathVariable Long id) {
        return ApiResponse.<QuestionGroupResponse>builder()
                .code(1000)
                .result(questionGroupService.getById(id))
                .build();
    }

    @GetMapping
    public ApiResponse<List<QuestionGroupResponse>> getAll() {
        return ApiResponse.<List<QuestionGroupResponse>>builder()
                .code(1000)
                .result(questionGroupService.getAll())
                .build();
    }

    @PutMapping("/{id}")
    @RolesAllowed("ADMIN")
    public ApiResponse<QuestionGroupResponse> update(
            @PathVariable Long id,
            @RequestBody QuestionGroupRequest request) {
        return ApiResponse.<QuestionGroupResponse>builder()
                .code(1000)
                .result(questionGroupService.update(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    @RolesAllowed("ADMIN")
    public ApiResponse<String> delete(@PathVariable Long id) {
        questionGroupService.delete(id);
        return ApiResponse.<String>builder()
                .code(1000)
                .message("Deleted question group")
                .result("Deleted question group")
                .build();
    }
}