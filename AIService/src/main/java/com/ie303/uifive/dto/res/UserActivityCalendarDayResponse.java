package com.ie303.uifive.dto.res;

import java.time.LocalDate;

public record UserActivityCalendarDayResponse(
        LocalDate date,
        boolean studied,
        boolean skipUsed,
        int studyCount,
        int skipCount
) {
}
