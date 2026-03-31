package com.ie303.uifive.dto.res;

import com.ie303.uifive.entity.SectionType;

public record SectionResponse(
        Long id,
        int sectionNumber,
        String title,
        SectionType sectionType,
        Long unitId
) {
}