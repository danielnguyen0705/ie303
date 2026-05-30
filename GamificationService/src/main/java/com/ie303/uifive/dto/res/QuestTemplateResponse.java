package com.ie303.uifive.dto.res;

import com.ie303.uifive.entity.DailyQuestType;
import com.ie303.uifive.entity.ItemType;
import com.ie303.uifive.entity.QuestPeriod;

public record QuestTemplateResponse(
        Long id,
        QuestPeriod questPeriod,
        DailyQuestType questType,
        String title,
        String description,
        int targetAmount,
        int coinsReward,
        int expReward,
        ItemType rewardItemType,
        int rewardItemQuantity,
        int sortOrder,
        boolean active
) {
}
