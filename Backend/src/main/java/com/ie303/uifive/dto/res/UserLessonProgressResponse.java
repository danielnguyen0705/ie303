package com.ie303.uifive.dto.res;

import java.time.LocalDateTime;

public record UserLessonProgressResponse(
        Long id,
        boolean completed,
        double score,
        double accuracy,
        double progressPercent,
        int coinsEarned,
        int expEarned,
        int currentExp,
        LocalDateTime lastAccessedAt,
        LocalDateTime completedAt,
        Long userId,
        Long lessonId
) {}