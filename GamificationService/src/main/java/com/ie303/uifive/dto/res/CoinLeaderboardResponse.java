package com.ie303.uifive.dto.res;

import java.util.List;

public record CoinLeaderboardResponse(
        int totalPlayers,
        List<CoinLeaderboardEntryResponse> leaderboard,
        CoinLeaderboardEntryResponse currentUser
) {
}
