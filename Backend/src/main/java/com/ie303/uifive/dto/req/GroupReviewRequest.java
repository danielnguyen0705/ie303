package com.ie303.uifive.dto.req;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record GroupReviewRequest(
        @NotBlank String title,
        int startUnit,
        int endUnit,
        Long gradeId,
        List<Long> questionIds,
        Boolean includeWrongQuestions,
        Integer aiQuestionCount,
        String aiQuestionTopic
) {
}