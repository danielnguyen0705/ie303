package com.ie303.uifive.dto.req;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record QuestionOptionRequest(
        @NotBlank(message = "optionText không được để trống")
        String optionText,

        boolean isCorrect,

        @NotNull(message = "questionId không được để trống")
        Long questionId
) {
}