package com.ie303.uifive.controller;

import com.ie303.uifive.dto.res.ApiResponse;
import com.ie303.uifive.dto.res.UserActivityCalendarResponse;
import com.ie303.uifive.service.UserActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserActivityController {

    private final UserActivityService userActivityService;

    @GetMapping("/me/activity-calendar")
    public ApiResponse<UserActivityCalendarResponse> getMyActivityCalendar(@RequestParam(required = false) Integer year,
                                                                           @RequestParam(required = false) Integer month,
                                                                           Authentication authentication) {
        String username = authentication.getName();

        return ApiResponse.<UserActivityCalendarResponse>builder()
                .code(1000)
                .result(userActivityService.getMyActivityCalendar(username, year, month))
                .build();
    }
}
