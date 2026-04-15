package com.ie303.uifive.controller;

import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.CoinLeaderboardResponse;
import com.ie303.uifive.dto.res.CollectorLeaderboardResponse;
import com.ie303.uifive.dto.res.ExpLeaderboardResponse;
import com.ie303.uifive.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/leaderboards")
@RequiredArgsConstructor
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    @GetMapping("/coins")
    public ApiResponse<CoinLeaderboardResponse> getCoinLeaderboard(
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ApiResponse.<CoinLeaderboardResponse>builder()
                .code(1000)
                .result(leaderboardService.getCoinLeaderboard(limit))
                .build();
    }

    @GetMapping("/collectors")
    public ApiResponse<CollectorLeaderboardResponse> getCollectorLeaderboard(
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ApiResponse.<CollectorLeaderboardResponse>builder()
                .code(1000)
                .result(leaderboardService.getCollectorLeaderboard(limit))
                .build();
    }

    @GetMapping("/exp")
    public ApiResponse<ExpLeaderboardResponse> getExpLeaderboard(
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ApiResponse.<ExpLeaderboardResponse>builder()
                .code(1000)
                .result(leaderboardService.getExpLeaderboard(limit))
                .build();
    }
}
