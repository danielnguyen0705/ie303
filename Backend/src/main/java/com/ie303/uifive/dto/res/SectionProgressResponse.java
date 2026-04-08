package com.ie303.uifive.dto.res;

public record SectionProgressResponse(
        Long sectionId,
        String sectionTitle,
        int sectionNumber,
        double progressPercent
) {
}
