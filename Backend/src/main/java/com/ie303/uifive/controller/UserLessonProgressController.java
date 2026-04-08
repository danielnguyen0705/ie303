package com.ie303.uifive.controller;

import com.ie303.uifive.dto.req.UserLessonProgressRequest;
import com.ie303.uifive.dto.res.UserLessonProgressResponse;
import com.ie303.uifive.service.UserLessonProgressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class UserLessonProgressController {

    private final UserLessonProgressService service;

    @PostMapping("/submit")
    public UserLessonProgressResponse submitLesson(
            Authentication authentication,
            @Valid @RequestBody UserLessonProgressRequest request
    ) {
        String username = authentication.getName();
        return service.submitLessonResult(username, request);
    }

    @GetMapping("/{id}")
    public UserLessonProgressResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }
}