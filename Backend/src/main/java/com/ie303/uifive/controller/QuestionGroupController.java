package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.QuestionGroupRequest;
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
    public ResponseEntity<QuestionGroupResponse> getById(@PathVariable Long id) {
        QuestionGroupResponse response = questionGroupService.getById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<QuestionGroupResponse>> getAll() {
        List<QuestionGroupResponse> responses = questionGroupService.getAll();
        return ResponseEntity.ok(responses);
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