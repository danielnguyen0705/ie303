package com.ie303.uifive.service;

import com.ie303.uifive.dto.res.UserProfileResponse;
import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.mapper.UserMapper;
import com.ie303.uifive.repo.UserLessonProgressRepo;
import com.ie303.uifive.repo.UserRepo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Mock
    private UserRepo repo;

    @Mock
    private UserMapper mapper;

    @Mock
    private EmailService emailService;

    @Mock
    private UserLessonProgressRepo userLessonProgressRepo;

    @InjectMocks
    private UserService userService;

    @Test
    void getMyProfile_ShouldRecheckStreakWhenUserMissedAFullDay() {
        ReflectionTestUtils.setField(userService, "studyTimeZone", "Asia/Ho_Chi_Minh");
        ZoneId zoneId = ZoneId.of("Asia/Ho_Chi_Minh");

        User user = new User();
        user.setId(101L);
        user.setUsername("student");
        user.setEmail("student@example.com");
        user.setRole(Role.USER);
        user.setCoin(250);
        user.setExp(600);
        user.setScore(80);
        user.setStreak(9);
        user.setLastStudyDate(LocalDate.now(zoneId).minusDays(1));
        user.setStreakItemPendingCount(0);

        when(repo.findByUsername("student")).thenReturn(user);
        when(userLessonProgressRepo.findDistinctGradesByUser(user)).thenReturn(List.of());
        when(repo.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserProfileResponse response = userService.getMyProfile("student");

        assertEquals(0, response.streak());
        assertEquals(0, user.getStreak());
        assertEquals(LocalDate.now(zoneId), user.getStreakCheckedAt());
    }
}
