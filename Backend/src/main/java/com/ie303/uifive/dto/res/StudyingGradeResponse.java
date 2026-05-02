package com.ie303.uifive.dto.res;

import lombok.Data;

public record StudyingGradeResponse(
        Long gradeId,
        String gradeName,
        double progressPercent
) {
}
