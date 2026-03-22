package com.ie303.uifive.dto.res;

import java.time.LocalDateTime;

public record UserUnitProgressResponse(
        Long id,
        boolean completed,
        double progressPercent,
        LocalDateTime unlockedAt,
        Long userId,
        Long unitId
) {}