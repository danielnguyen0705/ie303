package com.ie303.uifive.dto.res;

import com.ie303.uifive.entity.ItemType;

public record DailyQuestRewardItemResponse(
        Long shopItemId,
        String name,
        String imageUrl,
        ItemType type,
        int quantity
) {
}
