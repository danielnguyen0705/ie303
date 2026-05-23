package com.ie303.uifive.dto.res;

public record StudyingGradeResponse(
        Long gradeId,
        String gradeName,
        double progressPercent
) {
}
