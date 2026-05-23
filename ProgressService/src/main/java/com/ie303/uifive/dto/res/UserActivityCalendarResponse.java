package com.ie303.uifive.dto.res;

import java.util.List;

public record UserActivityCalendarResponse(
        int year,
        int month,
        String monthLabel,
        int totalStudyDays,
        int totalSkipDays,
        List<UserActivityCalendarDayResponse> days
) {
}
