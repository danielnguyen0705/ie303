package com.ie303.uifive.dto.res;

import java.util.List;

public record SemesterTestResponse(
        Long id,
        String title,
        int startUnit,
        int endUnit,
        int timeLimit,
        Long gradeId,
        List<Long> questionIds
) {
}