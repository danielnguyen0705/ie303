package com.ie303.uifive.dto.res;

import java.util.List;

public record GroupReviewResponse(
        Long id,
        String title,
        int startUnit,
        int endUnit,
        Long gradeId,
        List<Long> questionIds
) {
}