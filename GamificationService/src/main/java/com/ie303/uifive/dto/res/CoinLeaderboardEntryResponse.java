package com.ie303.uifive.dto.res;

public record CoinLeaderboardEntryResponse(
        Long userId,
        int rank,
        String username,
        String avatar,
        int coin,
        int score,
        int streak,
        boolean currentUser
) {
}
