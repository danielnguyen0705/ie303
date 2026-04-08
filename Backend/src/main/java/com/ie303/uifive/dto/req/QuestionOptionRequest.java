package com.ie303.uifive.dto.req;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record QuestionOptionRequest(
        String optionKey,

        @NotBlank(message = "content không được để trống")
        String content,

        boolean isCorrect,

        @NotNull(message = "questionId không được để trống")
        Long questionId
) {
}