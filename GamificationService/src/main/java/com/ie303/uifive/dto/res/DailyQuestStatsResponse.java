package com.ie303.uifive.dto.res;

public record DailyQuestStatsResponse(
        long totalCompleted,
        long totalActive,
        long totalXPEarned,
        long totalCoinsEarned,
        long streakDays,
        double completionRate
) {
}
