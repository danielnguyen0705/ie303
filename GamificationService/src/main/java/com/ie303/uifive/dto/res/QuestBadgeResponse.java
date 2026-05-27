package com.ie303.uifive.dto.res;

public record QuestBadgeResponse(
        String id,
        String title,
        String description,
        String icon,
        String category,
        boolean isLocked,
        int progress,
        int requirement,
        String unlockedAt
) {
}
