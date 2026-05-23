package com.ie303.uifive.controller;

import com.ie303.uifive.dto.res.StudyingGradeResponse;
import com.ie303.uifive.service.LearningProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class InternalUserController {

    private final LearningProgressService learningProgressService;

    @GetMapping("/internal/users/{username}/studying-grades")
    public List<StudyingGradeResponse> getStudyingGrades(@PathVariable String username) {
        return learningProgressService.getStudyingGradesByUsername(username);
    }
}
