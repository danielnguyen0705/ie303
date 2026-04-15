package com.ie303.uifive.dto.res;

public record ExpLeaderboardEntryResponse(
        Long userId,
        int rank,
        String username,
        String avatar,
        int exp,
        int streak,
        boolean currentUser
) {
}
