package com.ie303.uifive.dto.res;

public record SectionResponse(
        Long id,
        int sectionNumber,
        String title,
        Long unitId
) {
}