package com.ie303.uifive.dto.res;

public record UnitProgressResponse(
        Long unitId,
        String unitTitle,
        int unitNumber,
        double progressPercent
) {
}
