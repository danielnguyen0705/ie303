package com.ie303.uifive.dto.res;

public record UserSectionProgressResponse(
        Long id,
        boolean completed,
        double progressPercent,
        Long userId,
        Long sectionId
) {}