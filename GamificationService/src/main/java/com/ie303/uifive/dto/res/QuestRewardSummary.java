package com.ie303.uifive.dto.res;

import java.util.List;

public record QuestRewardSummary(
        int xp,
        int coins,
        List<DailyQuestRewardItemResponse> items
) {
}
