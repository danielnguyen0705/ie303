package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.UserQuestionHistoryRequest;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.UserQuestionHistoryResponse;
import com.ie303.uifive.service.UserQuestionHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user-question-histories")
@RequiredArgsConstructor
public class UserQuestionHistoryController {

    private final UserQuestionHistoryService service;

    @PostMapping("/submit")
    public UserQuestionHistoryResponse submit(@RequestBody UserQuestionHistoryRequest request) {
        return service.submit(request);
    }

    @GetMapping("/{id}")
    public ApiResponse<UserQuestionHistoryResponse> getById(@PathVariable Long id) {
        return ApiResponse.<UserQuestionHistoryResponse>builder()
                .code(1000)
                .result(service.getById(id))
                .build();
    }

    @GetMapping
    public ApiResponse<List<UserQuestionHistoryResponse>> getAll() {
        return ApiResponse.<List<UserQuestionHistoryResponse>>builder()
                .code(1000)
                .result(service.getAll())
                .build();
    }

    @GetMapping("/user/{userId}")
    public ApiResponse<List<UserQuestionHistoryResponse>> getByUserId(@PathVariable Long userId) {
        return ApiResponse.<List<UserQuestionHistoryResponse>>builder()
                .code(1000)
                .result(service.getByUserId(userId))
                .build();
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "Deleted user question history";
    }
}