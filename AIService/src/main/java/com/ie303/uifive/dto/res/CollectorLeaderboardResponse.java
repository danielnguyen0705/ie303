package com.ie303.uifive.dto.res;

import java.util.List;

public record CollectorLeaderboardResponse(
        int totalCollectors,
        long totalCollectibleItems,
        List<CollectorLeaderboardEntryResponse> leaderboard,
        CollectorLeaderboardEntryResponse currentUser
) {
}
