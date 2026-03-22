package com.ie303.uifive.dto.req;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SectionRequest(
        @NotNull(message = "sectionNumber không được để trống")
        Integer sectionNumber,

        @NotBlank(message = "title không được để trống")
        String title,

        @NotNull(message = "unitId không được để trống")
        Long unitId
) {
}