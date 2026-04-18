package com.ie303.uifive.dto.req;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record UnitReviewRequest(
        @NotBlank(message = "title không được để trống")
        String title,

        @NotNull(message = "unitId không được để trống")
        Long unitId,

        List<Long> questionIds,
        Boolean includeWrongQuestions
) {
}