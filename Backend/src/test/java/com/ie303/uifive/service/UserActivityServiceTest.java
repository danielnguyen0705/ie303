package com.ie303.uifive.service;

import com.ie303.uifive.dto.res.UserActivityCalendarResponse;
import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.SkipUsageLog;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.entity.UserLessonProgress;
import com.ie303.uifive.entity.UserQuestionHistory;
import com.ie303.uifive.entity.Lesson;
import com.ie303.uifive.entity.Question;
import com.ie303.uifive.repo.SkipUsageLogRepo;
import com.ie303.uifive.repo.UserLessonProgressRepo;
import com.ie303.uifive.repo.UserQuestionHistoryRepo;
import com.ie303.uifive.repo.UserRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.test.util.ReflectionTestUtils;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserActivityServiceTest {

    @Mock
    private UserRepo userRepo;

    @Mock
    private UserQuestionHistoryRepo userQuestionHistoryRepo;

    @Mock
    private UserLessonProgressRepo userLessonProgressRepo;

    @Mock
    private SkipUsageLogRepo skipUsageLogRepo;

    @InjectMocks
    private UserActivityService userActivityService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(userActivityService, "activityTimeZone", "Asia/Ho_Chi_Minh");
    }

    @Test
    void getMyActivityCalendar_ShouldAggregateStudyAndSkipDays() {
        User user = new User();
        user.setId(99L);
        user.setUsername("learner");
        user.setRole(Role.USER);

        when(userRepo.findByUsername("learner")).thenReturn(user);

        LocalDateTime may10Morning = LocalDateTime.of(2026, 5, 10, 9, 0);
        LocalDateTime may10Evening = LocalDateTime.of(2026, 5, 10, 18, 0);
        LocalDateTime may12Noon = LocalDateTime.of(2026, 5, 12, 12, 0);

        Question question = new Question();
        question.setId(1L);

        UserQuestionHistory history = new UserQuestionHistory();
        history.setUser(user);
        history.setQuestion(question);
        history.setAnsweredAt(may10Morning);

        Lesson lesson = new Lesson();
        lesson.setId(2L);

        UserLessonProgress lessonProgress = new UserLessonProgress();
        lessonProgress.setUser(user);
        lessonProgress.setLesson(lesson);
        lessonProgress.setCompleted(true);
        lessonProgress.setCompletedAt(may10Evening);

        SkipUsageLog skipUsageLog = new SkipUsageLog();
        skipUsageLog.setUser(user);
        skipUsageLog.setUsedAt(may12Noon);

        when(userQuestionHistoryRepo.findByUserIdAndAnsweredAtGreaterThanEqualAndAnsweredAtLessThan(
                99L,
                LocalDateTime.of(2026, 5, 1, 0, 0),
                LocalDateTime.of(2026, 6, 1, 0, 0)
        )).thenReturn(List.of(history));

        when(userLessonProgressRepo.findByUserIdAndCompletedTrueAndCompletedAtGreaterThanEqualAndCompletedAtLessThan(
                99L,
                LocalDateTime.of(2026, 5, 1, 0, 0),
                LocalDateTime.of(2026, 6, 1, 0, 0)
        )).thenReturn(List.of(lessonProgress));

        when(skipUsageLogRepo.findByUserIdAndUsedAtGreaterThanEqualAndUsedAtLessThan(
                99L,
                LocalDateTime.of(2026, 5, 1, 0, 0),
                LocalDateTime.of(2026, 6, 1, 0, 0)
        )).thenReturn(List.of(skipUsageLog));

        UserActivityCalendarResponse response = userActivityService.getMyActivityCalendar("learner", 2026, 5);

        assertEquals(2026, response.year());
        assertEquals(5, response.month());
        assertEquals(31, response.days().size());
        assertTrue(response.days().stream().anyMatch(day -> day.date().getDayOfMonth() == 10 && day.studied()));
        assertTrue(response.days().stream().anyMatch(day -> day.date().getDayOfMonth() == 12 && day.skipUsed()));
        assertEquals(1, response.totalStudyDays());
        assertEquals(1, response.totalSkipDays());
    }
}
