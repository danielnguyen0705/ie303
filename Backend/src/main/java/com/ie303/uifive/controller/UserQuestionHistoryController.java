package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.UserQuestionHistoryRequest;
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
    public UserQuestionHistoryResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping
    public List<UserQuestionHistoryResponse> getAll() {
        return service.getAll();
    }

    @GetMapping("/user/{userId}")
    public List<UserQuestionHistoryResponse> getByUserId(@PathVariable Long userId) {
        return service.getByUserId(userId);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        service.delete(id);
        return "Deleted user question history";
    }
}