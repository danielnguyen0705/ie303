package com.ie303.uifive.controller;

import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.DailyQuestClaimResponse;
import com.ie303.uifive.dto.res.DailyQuestResponse;
import com.ie303.uifive.dto.res.DailyQuestStatsResponse;
import com.ie303.uifive.dto.res.QuestBadgeResponse;
import com.ie303.uifive.service.DailyQuestService;
import jakarta.annotation.security.RolesAllowed;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/quests")
@RequiredArgsConstructor
@RolesAllowed({"USER", "ADMIN"})
public class QuestController {

    private final DailyQuestService dailyQuestService;

    @GetMapping
    public ApiResponse<List<DailyQuestResponse>> getMyQuests() {
        return ApiResponse.<List<DailyQuestResponse>>builder()
                .code(1000)
                .result(dailyQuestService.getMyDailyQuests())
                .build();
    }

    @GetMapping("/me")
    public ApiResponse<List<DailyQuestResponse>> getMyQuestsAlias() {
        return getMyQuests();
    }

    @GetMapping("/{questId}")
    public ApiResponse<DailyQuestResponse> getQuest(@PathVariable Long questId) {
        return ApiResponse.<DailyQuestResponse>builder()
                .code(1000)
                .result(dailyQuestService.getQuest(questId))
                .build();
    }

    @PostMapping("/{questId}/claim")
    public ApiResponse<DailyQuestClaimResponse> claimQuest(@PathVariable Long questId) {
        return ApiResponse.<DailyQuestClaimResponse>builder()
                .code(1000)
                .result(dailyQuestService.claimQuest(questId))
                .build();
    }

    @GetMapping("/stats")
    public ApiResponse<DailyQuestStatsResponse> getStats() {
        return ApiResponse.<DailyQuestStatsResponse>builder()
                .code(1000)
                .result(dailyQuestService.getQuestStats())
                .build();
    }

    @GetMapping("/badges")
    public ApiResponse<List<QuestBadgeResponse>> getBadges() {
        return ApiResponse.<List<QuestBadgeResponse>>builder()
                .code(1000)
                .result(dailyQuestService.getBadges())
                .build();
    }
}
