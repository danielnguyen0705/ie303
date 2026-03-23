package com.ie303.uifive.dto.res;

import java.time.LocalDateTime;

public record UserLessonProgressResponse(
        Long id,
        boolean completed,
        double score,
        double accuracy,
        int coinsEarned,
        LocalDateTime completedAt,
        Long userId,
        Long lessonId
) {}