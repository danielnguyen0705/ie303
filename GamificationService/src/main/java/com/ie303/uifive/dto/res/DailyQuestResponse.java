package com.ie303.uifive.dto.res;

import com.ie303.uifive.entity.DailyQuestType;

import java.util.List;

public record DailyQuestResponse(
        String id,
        String title,
        String description,
        String type,
        DailyQuestType questType,
        int progress,
        int target,
        int xpReward,
        int coinsReward,
        String expiresAt,
        String status,
        List<DailyQuestRewardItemResponse> rewardItems
) {
}
