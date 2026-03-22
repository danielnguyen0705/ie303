package com.ie303.uifive.dto.res;

public record UnitResponse(
        Long id,
        int unitNumber,
        String title,
        String description,
        Long gradeId
) {
}