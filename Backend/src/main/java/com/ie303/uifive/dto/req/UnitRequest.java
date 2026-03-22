package com.ie303.uifive.dto.req;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UnitRequest(
        @NotNull(message = "unitNumber không được để trống")
        Integer unitNumber,

        @NotBlank(message = "title không được để trống")
        String title,

        String description,

        @NotNull(message = "gradeId không được để trống")
        Long gradeId
) {
}