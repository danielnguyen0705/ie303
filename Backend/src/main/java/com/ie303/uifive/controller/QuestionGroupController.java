package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.QuestionGroupRequest;
import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.QuestionGroupResponse;
import com.ie303.uifive.service.QuestionGroupService;
import jakarta.annotation.security.RolesAllowed;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/question-groups")
@RequiredArgsConstructor
public class QuestionGroupController {

    private final QuestionGroupService questionGroupService;

    @PostMapping
    @RolesAllowed("ADMIN")
    public ResponseEntity<QuestionGroupResponse> create(@RequestBody QuestionGroupRequest request) {
        QuestionGroupResponse response = questionGroupService.create(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
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
    public ResponseEntity<QuestionGroupResponse> update(
            @PathVariable Long id,
            @RequestBody QuestionGroupRequest request) {
        QuestionGroupResponse response = questionGroupService.update(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @RolesAllowed("ADMIN")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        questionGroupService.delete(id);
        return ResponseEntity.noContent().build();
    }
}