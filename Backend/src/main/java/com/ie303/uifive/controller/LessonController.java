package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.LessonRequest;
import com.ie303.uifive.dto.res.LessonResponse;
import com.ie303.uifive.service.LessonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lessons")
@RequiredArgsConstructor
public class LessonController {

    private final LessonService lessonService;

    @PostMapping
    public LessonResponse create(@RequestBody @Valid LessonRequest request) {
        return lessonService.create(request);
    }

    @GetMapping("/{id}")
    public LessonResponse getById(@PathVariable Long id) {
        return lessonService.getById(id);
    }

    @GetMapping
    public List<LessonResponse> getAll() {
        return lessonService.getAll();
    }

    @PutMapping("/{id}")
    public LessonResponse update(@PathVariable Long id,
                                 @RequestBody @Valid LessonRequest request) {
        return lessonService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        lessonService.delete(id);
        return "Deleted lesson with id: " + id;
    }
}