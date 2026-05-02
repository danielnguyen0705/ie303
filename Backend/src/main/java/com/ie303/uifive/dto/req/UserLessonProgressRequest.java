package com.ie303.uifive.dto.req;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record UserLessonProgressRequest(
        @NotNull Long lessonId,
        @PositiveOrZero double score,
        @PositiveOrZero double accuracy
) {}