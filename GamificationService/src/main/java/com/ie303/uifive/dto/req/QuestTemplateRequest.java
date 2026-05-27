package com.ie303.uifive.dto.req;

import com.ie303.uifive.entity.DailyQuestType;
import com.ie303.uifive.entity.ItemType;
import com.ie303.uifive.entity.QuestPeriod;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record QuestTemplateRequest(
        @NotNull QuestPeriod questPeriod,
        @NotNull DailyQuestType questType,
        @NotBlank String title,
        @NotBlank String description,
        @Min(1) int targetAmount,
        @Min(0) int coinsReward,
        @Min(0) int expReward,
        ItemType rewardItemType,
        @Min(0) int rewardItemQuantity,
        @Min(0) int sortOrder,
        boolean active
) {
}
