package com.ie303.uifive.service;

import com.ie303.uifive.dto.res.UserActivityCalendarDayResponse;
import com.ie303.uifive.dto.res.UserActivityCalendarResponse;
import com.ie303.uifive.entity.SkipUsageLog;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.entity.UserLessonProgress;
import com.ie303.uifive.entity.UserQuestionHistory;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.repo.SkipUsageLogRepo;
import com.ie303.uifive.repo.UserLessonProgressRepo;
import com.ie303.uifive.repo.UserQuestionHistoryRepo;
import com.ie303.uifive.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.TextStyle;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserActivityService {

    @Value("${notification.time-zone:Asia/Ho_Chi_Minh}")
    private String activityTimeZone;

    private final UserRepo userRepo;
    private final UserQuestionHistoryRepo userQuestionHistoryRepo;
    private final UserLessonProgressRepo userLessonProgressRepo;
    private final SkipUsageLogRepo skipUsageLogRepo;

    public UserActivityCalendarResponse getMyActivityCalendar(String username, Integer year, Integer month) {
        User user = userRepo.findByUsername(username);
        if (user == null) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }

        ZoneId zoneId = ZoneId.of(activityTimeZone);
        YearMonth targetMonth = resolveTargetMonth(zoneId, year, month);
        LocalDate monthStart = targetMonth.atDay(1);
        LocalDate nextMonthStart = targetMonth.plusMonths(1).atDay(1);

        LocalDateTime from = monthStart.atStartOfDay();
        LocalDateTime to = nextMonthStart.atStartOfDay();

        List<UserQuestionHistory> questionHistories =
                userQuestionHistoryRepo.findByUserIdAndAnsweredAtGreaterThanEqualAndAnsweredAtLessThan(
                        user.getId(), from, to);

        List<UserLessonProgress> lessonProgresses =
                userLessonProgressRepo.findByUserIdAndCompletedTrueAndCompletedAtGreaterThanEqualAndCompletedAtLessThan(
                        user.getId(), from, to);

        List<SkipUsageLog> skipUsageLogs =
                skipUsageLogRepo.findByUserIdAndUsedAtGreaterThanEqualAndUsedAtLessThan(
                        user.getId(), from, to);

        Map<LocalDate, ActivityBucket> buckets = new LinkedHashMap<>();
        for (LocalDate day = monthStart; !day.isEqual(nextMonthStart); day = day.plusDays(1)) {
            buckets.put(day, new ActivityBucket());
        }

        for (UserQuestionHistory history : questionHistories) {
            if (history.getAnsweredAt() == null) {
                continue;
            }
            ActivityBucket bucket = buckets.get(history.getAnsweredAt().toLocalDate());
            if (bucket != null) {
                bucket.studied = true;
                bucket.studyCount++;
            }
        }

        for (UserLessonProgress progress : lessonProgresses) {
            if (progress.getCompletedAt() == null) {
                continue;
            }
            ActivityBucket bucket = buckets.get(progress.getCompletedAt().toLocalDate());
            if (bucket != null) {
                bucket.studied = true;
                bucket.studyCount++;
            }
        }

        for (SkipUsageLog logEntry : skipUsageLogs) {
            if (logEntry.getUsedAt() == null) {
                continue;
            }
            ActivityBucket bucket = buckets.get(logEntry.getUsedAt().toLocalDate());
            if (bucket != null) {
                bucket.skipUsed = true;
                bucket.skipCount++;
            }
        }

        List<UserActivityCalendarDayResponse> days = buckets.entrySet().stream()
                .map(entry -> new UserActivityCalendarDayResponse(
                        entry.getKey(),
                        entry.getValue().studied,
                        entry.getValue().skipUsed,
                        entry.getValue().studyCount,
                        entry.getValue().skipCount
                ))
                .toList();

        int totalStudyDays = (int) days.stream().filter(UserActivityCalendarDayResponse::studied).count();
        int totalSkipDays = (int) days.stream().filter(UserActivityCalendarDayResponse::skipUsed).count();

        return new UserActivityCalendarResponse(
                targetMonth.getYear(),
                targetMonth.getMonthValue(),
                targetMonth.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH),
                totalStudyDays,
                totalSkipDays,
                days
        );
    }

    private YearMonth resolveTargetMonth(ZoneId zoneId, Integer year, Integer month) {
        if (year == null || month == null) {
            LocalDate today = LocalDate.now(zoneId);
            return YearMonth.from(today);
        }

        try {
            return YearMonth.of(year, month);
        } catch (DateTimeException ex) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Year and month are invalid");
        }
    }

    private static final class ActivityBucket {
        private boolean studied;
        private boolean skipUsed;
        private int studyCount;
        private int skipCount;
    }
}
