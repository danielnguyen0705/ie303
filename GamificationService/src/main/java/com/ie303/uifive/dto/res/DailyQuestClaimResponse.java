package com.ie303.uifive.dto.res;

public record DailyQuestClaimResponse(
        DailyQuestResponse quest,
        QuestRewardSummary rewards
) {
}
