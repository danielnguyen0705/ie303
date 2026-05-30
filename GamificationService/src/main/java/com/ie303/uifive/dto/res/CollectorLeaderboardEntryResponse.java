package com.ie303.uifive.dto.res;

public record CollectorLeaderboardEntryResponse(
        Long userId,
        int rank,
        String username,
        String avatar,
        int collectibleCount,
        int avatarCount,
        int backgroundCount,
        double collectionPercent,
        String title,
        boolean showcaseReady,
        boolean currentUser
) {
}
