package com.ie303.uifive.dto.req;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UserSectionProgressRequest(
        @NotNull Long userId,
        @NotNull Long sectionId,

        @Min(0) @Max(100)
        double progressPercent,

        boolean completed
) {}