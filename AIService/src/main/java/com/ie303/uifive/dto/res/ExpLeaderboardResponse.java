package com.ie303.uifive.dto.res;

import java.util.List;

public record ExpLeaderboardResponse(
        int totalPlayers,
        List<ExpLeaderboardEntryResponse> leaderboard,
        ExpLeaderboardEntryResponse currentUser
) {
}
