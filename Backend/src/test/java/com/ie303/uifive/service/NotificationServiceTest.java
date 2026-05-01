package com.ie303.uifive.service;

import com.ie303.uifive.entity.ItemType;
import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.ShopItem;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.repo.UserRepo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.test.util.ReflectionTestUtils;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private UserRepo userRepo;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(notificationService, "notificationTimeZone", "Asia/Ho_Chi_Minh");
        ReflectionTestUtils.setField(notificationService, "vipReminderDaysBefore", 3);
    }

    @Test
    void sendVipExpiryReminders_ShouldNotifyUsersCloseToExpiry() {
        ZoneId zoneId = ZoneId.of("Asia/Ho_Chi_Minh");

        User targetUser = new User();
        targetUser.setId(1L);
        targetUser.setUsername("student");
        targetUser.setEmail("student@example.com");
        targetUser.setRole(Role.USER);
        targetUser.setVerified(true);
        targetUser.setVipExpiredAt(LocalDateTime.now(zoneId).plusDays(2));

        User ignoredUser = new User();
        ignoredUser.setId(2L);
        ignoredUser.setUsername("ignored");
        ignoredUser.setEmail("ignored@example.com");
        ignoredUser.setRole(Role.USER);
        ignoredUser.setVerified(true);
        ignoredUser.setVipExpiredAt(LocalDateTime.now(zoneId).plusDays(10));

        when(userRepo.findAll())
                .thenReturn(List.of(targetUser, ignoredUser));

        notificationService.sendVipExpiryReminders();

        verify(emailService).sendVipExpiryReminderEmail("student@example.com", "student", targetUser.getVipExpiredAt(), 2);
        verify(emailService, never()).sendVipExpiryReminderEmail("ignored@example.com", "ignored", ignoredUser.getVipExpiredAt(), 10);
    }

    @Test
    void sendStreakReminders_ShouldNotifyUsersOneDayAwayFromReset() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));

        User targetUser = new User();
        targetUser.setId(3L);
        targetUser.setUsername("learner");
        targetUser.setEmail("learner@example.com");
        targetUser.setRole(Role.USER);
        targetUser.setVerified(true);
        targetUser.setStreak(7);
        targetUser.setStreakItemPendingCount(0);
        targetUser.setLastStudyDate(today.minusDays(1));

        User ignoredUser = new User();
        ignoredUser.setId(4L);
        ignoredUser.setUsername("safe");
        ignoredUser.setEmail("safe@example.com");
        ignoredUser.setRole(Role.USER);
        ignoredUser.setVerified(true);
        ignoredUser.setStreak(5);
        ignoredUser.setStreakItemPendingCount(1);
        ignoredUser.setLastStudyDate(today.minusDays(1));

        when(userRepo.findAll())
                .thenReturn(List.of(targetUser, ignoredUser));

        notificationService.sendStreakReminders();

        verify(emailService).sendStreakReminderEmail("learner@example.com", "learner", 7, targetUser.getLastStudyDate());
        verify(emailService, never()).sendStreakReminderEmail("safe@example.com", "safe", 5, ignoredUser.getLastStudyDate());
    }

    @Test
    void announceNewShopItem_ShouldNotifyAllVerifiedUsers() {
        User firstUser = new User();
        firstUser.setId(5L);
        firstUser.setUsername("first");
        firstUser.setEmail("first@example.com");
        firstUser.setRole(Role.USER);
        firstUser.setVerified(true);

        User secondUser = new User();
        secondUser.setId(6L);
        secondUser.setUsername("second");
        secondUser.setEmail("second@example.com");
        secondUser.setRole(Role.USER);
        secondUser.setVerified(true);

        when(userRepo.findAll())
                .thenReturn(List.of(firstUser, secondUser));

        ShopItem item = new ShopItem();
        item.setId(100L);
        item.setName("VIP 7 days");
        item.setDescription("Gia han VIP");
        item.setPrice(150);
        item.setType(ItemType.VIP);
        item.setDurationDays(7);
        item.setActive(true);

        notificationService.announceNewShopItem(item);

        verify(emailService).sendNewShopItemAnnouncementEmail("first@example.com", item);
        verify(emailService).sendNewShopItemAnnouncementEmail("second@example.com", item);
    }
}
