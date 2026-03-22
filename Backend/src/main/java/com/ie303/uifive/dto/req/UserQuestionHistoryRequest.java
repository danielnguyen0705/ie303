package com.ie303.uifive.dto.req;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UserQuestionHistoryRequest(
        @NotNull Long userId,
        @NotNull Long questionId,

        @NotBlank(message = "selectedAnswer không được để trống")
        String selectedAnswer
) {
}