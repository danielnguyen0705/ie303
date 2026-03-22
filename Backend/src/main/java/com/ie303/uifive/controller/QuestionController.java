package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.QuestionRequest;
import com.ie303.uifive.dto.res.QuestionResponse;
import com.ie303.uifive.service.QuestionService;
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
    public QuestionResponse create(@RequestBody @Valid QuestionRequest request) {
        return questionService.create(request);
    }

    @GetMapping("/{id}")
    public QuestionResponse getById(@PathVariable Long id) {
        return questionService.getById(id);
    }

    @GetMapping
    public List<QuestionResponse> getAll() {
        return questionService.getAll();
    }

    @PutMapping("/{id}")
    public QuestionResponse update(@PathVariable Long id,
                                   @RequestBody @Valid QuestionRequest request) {
        return questionService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        questionService.delete(id);
        return "Deleted question with id: " + id;
    }
}