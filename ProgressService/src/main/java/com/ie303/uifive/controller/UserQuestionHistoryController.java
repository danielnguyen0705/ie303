package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.UserQuestionHistoryRequest;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.UserQuestionHistoryResponse;
import com.ie303.uifive.service.UserQuestionHistoryService;
import jakarta.annotation.security.RolesAllowed;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/user-question-histories")
@RequiredArgsConstructor
@RolesAllowed({"USER", "ADMIN"})
public class UserQuestionHistoryController {

    private final UserQuestionHistoryService service;

    @PostMapping("/submit")
    public ApiResponse<UserQuestionHistoryResponse> submit(@RequestBody UserQuestionHistoryRequest request) {
        return ApiResponse.<UserQuestionHistoryResponse>builder()
                .code(1000)
                .result(service.submit(request))
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<UserQuestionHistoryResponse> getById(@PathVariable Long id) {
        return ApiResponse.<UserQuestionHistoryResponse>builder()
                .code(1000)
                .result(service.getById(id))
                .build();
    }

    @GetMapping
    @RolesAllowed("ADMIN")
    public ApiResponse<List<UserQuestionHistoryResponse>> getAll() {
        return ApiResponse.<List<UserQuestionHistoryResponse>>builder()
                .code(1000)
                .result(service.getAll())
                .build();
    }

    @GetMapping("/user/{userId}")
    @RolesAllowed("ADMIN")
    public ApiResponse<List<UserQuestionHistoryResponse>> getByUserId(@PathVariable Long userId) {
        return ApiResponse.<List<UserQuestionHistoryResponse>>builder()
                .code(1000)
                .result(service.getByUserId(userId))
                .build();
    }

    @GetMapping("/me")
    public ApiResponse<List<UserQuestionHistoryResponse>> getMyQuestionHistories(Authentication authentication) {
        return ApiResponse.<List<UserQuestionHistoryResponse>>builder()
                .code(1000)
                .result(service.getByUsername(authentication.getName()))
                .build();
    }

    @DeleteMapping("/{id}")
    @RolesAllowed("ADMIN")
    public ApiResponse<String> delete(@PathVariable Long id) {
        service.delete(id);
        return ApiResponse.<String>builder()
                .code(1000)
                .message("Deleted user question history")
                .result("Deleted user question history")
                .build();
    }
}
