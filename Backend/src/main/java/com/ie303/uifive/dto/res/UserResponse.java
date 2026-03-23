package com.ie303.uifive.dto.res;

import com.ie303.uifive.entity.Role;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String username,
        String email,
        Role role,
        int coin,
        int score,
        int streak,
        LocalDate lastStudyDate,
        LocalDateTime vipExpiredAt,
        LocalDateTime createdAt
) {
}