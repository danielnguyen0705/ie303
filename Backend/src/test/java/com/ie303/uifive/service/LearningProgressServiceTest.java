package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.UserLessonProgressRequest;
import com.ie303.uifive.entity.Grade;
import com.ie303.uifive.entity.Lesson;
import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.Section;
import com.ie303.uifive.entity.Unit;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.entity.UserLessonProgress;
import com.ie303.uifive.mapper.UserLessonProgressMapper;
import com.ie303.uifive.repo.LessonRepo;
import com.ie303.uifive.repo.SectionRepo;
import com.ie303.uifive.repo.UnitRepo;
import com.ie303.uifive.repo.UserLessonProgressRepo;
import com.ie303.uifive.repo.UserRepo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LearningProgressServiceTest {

    @Mock
    private UserService userService;

    @Mock
    private UserRepo userRepo;

    @Mock
    private UnitRepo unitRepo;

    @Mock
    private SectionRepo sectionRepo;

    @Mock
    private LessonRepo lessonRepo;

    @Mock
    private UserLessonProgressRepo userLessonProgressRepo;

    @Mock
    private UserLessonProgressMapper userLessonProgressMapper;

    @Mock
    private MLPredictionService mlPredictionService;

    @InjectMocks
    private LearningProgressService learningProgressService;

    @Test
    void completeLesson_ShouldNotConsumeOrDuplicatePendingStreakOnNormalDailyStudy() {
        ZoneId zoneId = ZoneId.of("Asia/Ho_Chi_Minh");

        User user = new User();
        user.setId(11L);
        user.setRole(Role.USER);
        user.setCoin(100);
        user.setExp(200);
        user.setStreak(5);
        user.setStreakItemPendingCount(1);
        user.setLastStudyDate(LocalDate.now(zoneId).minusDays(1));

        Grade grade = new Grade();
        grade.setId(1L);

        Unit unit = new Unit();
        unit.setId(2L);
        unit.setGrade(grade);

        Section section = new Section();
        section.setId(3L);
        section.setUnit(unit);

        Lesson lesson = new Lesson();
        lesson.setId(4L);
        lesson.setSection(section);
        lesson.setVipOnly(false);

        UserLessonProgressRequest request = new UserLessonProgressRequest(lesson.getId(), 10.0, 100.0);

        UserLessonProgress progress = new UserLessonProgress();
        progress.setUser(user);
        progress.setLesson(lesson);
        progress.setCompleted(false);
        progress.setCoinsEarned(0);

        when(userService.getCurrentUser()).thenReturn(user);
        when(lessonRepo.findById(lesson.getId())).thenReturn(Optional.of(lesson));
        when(lessonRepo.findAllByGradeIdOrder(grade.getId())).thenReturn(List.of(lesson));
        when(userLessonProgressRepo.findCompletedLessonIdsByUserAndGrade(user, grade.getId()))
                .thenReturn(Set.of());
        when(userLessonProgressRepo.findByUserIdAndLessonId(user.getId(), lesson.getId()))
                .thenReturn(Optional.empty());
        when(userLessonProgressMapper.toEntity(request)).thenReturn(progress);
        when(userLessonProgressRepo.save(any(UserLessonProgress.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doAnswer(invocation -> {
            user.setStreak(user.getStreak() + 1);
            return null;
        }).when(userService).touchStudyStreak(user.getId());
        when(userRepo.findById(user.getId())).thenReturn(Optional.of(user));
        when(userRepo.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        learningProgressService.completeLesson(request);

        assertEquals(6, user.getStreak());
        assertEquals(1, user.getStreakItemPendingCount());
        assertEquals(118, user.getCoin());
        assertEquals(236, user.getExp());
    }
}
