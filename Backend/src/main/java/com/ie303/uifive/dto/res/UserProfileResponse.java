package com.ie303.uifive.dto.res;

import com.ie303.uifive.entity.Role;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record UserProfileResponse(
        Long id,
        String username,
        String email,
        Role role,
        int coin,
        int exp,
        int score,
        int streak,
        LocalDate lastStudyDate,
        LocalDateTime vipExpiredAt,
        boolean isVip,
        LocalDateTime createdAt,
        List<StudyingGradeResponse> studyingGrades
) {
}
