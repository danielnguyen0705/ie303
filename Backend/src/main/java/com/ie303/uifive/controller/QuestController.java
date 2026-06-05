package com.ie303.uifive.controller;

import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import jakarta.annotation.security.RolesAllowed;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/quests")
@RolesAllowed({"USER", "ADMIN"})
public class QuestController {

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> getAllQuests() {
        return ApiResponse.<List<Map<String, Object>>>builder()
                .code(1000)
                .message("Quest feature is under development")
                .result(List.of())
                .build();
    }

    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> getQuestStats() {
        return ApiResponse.<Map<String, Object>>builder()
                .code(1000)
                .message("Quest feature is under development")
                .result(Map.of(
                        "totalCompleted", 0,
                        "totalActive", 0,
                        "totalXPEarned", 0,
                        "totalCoinsEarned", 0,
                        "streakDays", 0,
                        "completionRate", 0
                ))
                .build();
    }

    @GetMapping("/badges")
    public ApiResponse<List<Map<String, Object>>> getAllBadges() {
        return ApiResponse.<List<Map<String, Object>>>builder()
                .code(1000)
                .message("Achievement feature is under development")
                .result(List.of())
                .build();
    }

    @GetMapping("/{questId}")
    public ApiResponse<Map<String, Object>> getQuestById(@PathVariable String questId) {
        throw new AppException(ErrorCode.INVALID_REQUEST, "Quest " + questId + " is not available");
    }

    @PostMapping("/{questId}/claim")
    public ApiResponse<Map<String, Object>> claimQuestReward(@PathVariable String questId) {
        throw new AppException(ErrorCode.INVALID_REQUEST, "Quest claiming is under development for quest " + questId);
    }
}
