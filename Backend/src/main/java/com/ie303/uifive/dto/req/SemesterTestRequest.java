package com.ie303.uifive.dto.req;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record SemesterTestRequest(
        @NotBlank(message = "title không được để trống")
        String title,

        int startUnit,
        int endUnit,
        int timeLimit,

        Long gradeId,

        List<Long> questionGroupIds,
        List<Long> questionIds,
        Boolean includeWrongQuestions,
        Integer aiQuestionCount,
        String aiQuestionTopic
) {
}