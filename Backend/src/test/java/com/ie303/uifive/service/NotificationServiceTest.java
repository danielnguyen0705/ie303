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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verifyNoInteractions;
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
        targetUser.setEmail("tohigh2023@gmail.com");
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

        verify(emailService).sendVipExpiryReminderEmail("tohigh2023@gmail.com", "student", targetUser.getVipExpiredAt(), 2);
        verify(emailService, never()).sendVipExpiryReminderEmail("ignored@example.com", "ignored", ignoredUser.getVipExpiredAt(), 10);
    }

    @Test
    void sendVipExpiryReminders_ShouldIgnoreUsersWithoutEmailOrNonUserRole() {
        ZoneId zoneId = ZoneId.of("Asia/Ho_Chi_Minh");

        User noEmailUser = new User();
        noEmailUser.setId(10L);
        noEmailUser.setUsername("no-email");
        noEmailUser.setEmail(" ");
        noEmailUser.setRole(Role.USER);
        noEmailUser.setVipExpiredAt(LocalDateTime.now(zoneId).plusDays(1));

        User adminUser = new User();
        adminUser.setId(11L);
        adminUser.setUsername("admin");
        adminUser.setEmail("admin@example.com");
        adminUser.setRole(Role.ADMIN);
        adminUser.setVipExpiredAt(LocalDateTime.now(zoneId).plusDays(1));

        when(userRepo.findAll()).thenReturn(List.of(noEmailUser, adminUser));

        notificationService.sendVipExpiryReminders();

        verifyNoInteractions(emailService);
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
    void sendStreakReminders_ShouldSkipUsersAlreadyCheckedOrWithoutStreak() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));

        User checkedUser = new User();
        checkedUser.setId(12L);
        checkedUser.setUsername("checked");
        checkedUser.setEmail("checked@example.com");
        checkedUser.setRole(Role.USER);
        checkedUser.setStreak(3);
        checkedUser.setStreakItemPendingCount(0);
        checkedUser.setLastStudyDate(today.minusDays(1));
        checkedUser.setStreakCheckedAt(today);

        User noStreakUser = new User();
        noStreakUser.setId(13L);
        noStreakUser.setUsername("nostreak");
        noStreakUser.setEmail("nostreak@example.com");
        noStreakUser.setRole(Role.USER);
        noStreakUser.setStreak(0);
        noStreakUser.setStreakItemPendingCount(0);
        noStreakUser.setLastStudyDate(today.minusDays(1));

        when(userRepo.findAll()).thenReturn(List.of(checkedUser, noStreakUser));

        notificationService.sendStreakReminders();

        verify(emailService).sendStreakReminderEmail(
                "checked@example.com",
                "checked",
                3,
                checkedUser.getLastStudyDate()
        );
        verify(emailService, never()).sendStreakReminderEmail(
                "nostreak@example.com",
                "nostreak",
                0,
                noStreakUser.getLastStudyDate()
        );
    }

    @Test
    void resetInactiveStreaks_ShouldConsumeFreezeAndPreserveStreak() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));

        User frozenUser = new User();
        frozenUser.setId(7L);
        frozenUser.setUsername("frozen");
        frozenUser.setEmail("frozen@example.com");
        frozenUser.setRole(Role.USER);
        frozenUser.setVerified(true);
        frozenUser.setStreak(12);
        frozenUser.setStreakItemPendingCount(1);
        frozenUser.setLastStudyDate(today.minusDays(1));
        frozenUser.setStreakCheckedAt(null);

        User resetUser = new User();
        resetUser.setId(8L);
        resetUser.setUsername("reset");
        resetUser.setEmail("reset@example.com");
        resetUser.setRole(Role.USER);
        resetUser.setVerified(true);
        resetUser.setStreak(4);
        resetUser.setStreakItemPendingCount(0);
        resetUser.setLastStudyDate(today.minusDays(1));
        resetUser.setStreakCheckedAt(null);

        when(userRepo.findAll())
                .thenReturn(List.of(frozenUser, resetUser));

        notificationService.resetInactiveStreaks();

        verify(userRepo).save(frozenUser);
        verify(userRepo).save(resetUser);
        org.junit.jupiter.api.Assertions.assertEquals(12, frozenUser.getStreak());
        org.junit.jupiter.api.Assertions.assertEquals(0, frozenUser.getStreakItemPendingCount());
        org.junit.jupiter.api.Assertions.assertEquals(today, frozenUser.getStreakCheckedAt());
        org.junit.jupiter.api.Assertions.assertEquals(today.minusDays(1), frozenUser.getLastStudyDate());
        org.junit.jupiter.api.Assertions.assertEquals(0, resetUser.getStreak());
        org.junit.jupiter.api.Assertions.assertEquals(today, resetUser.getStreakCheckedAt());
        org.junit.jupiter.api.Assertions.assertEquals(today.minusDays(1), resetUser.getLastStudyDate());
    }

    @Test
    void resetInactiveStreaks_ShouldSkipUsersWithoutYesterdayStudyOrAlreadyChecked() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));

        User todayStudyUser = new User();
        todayStudyUser.setId(14L);
        todayStudyUser.setUsername("today");
        todayStudyUser.setEmail("today@example.com");
        todayStudyUser.setRole(Role.USER);
        todayStudyUser.setStreak(5);
        todayStudyUser.setLastStudyDate(today);
        todayStudyUser.setStreakCheckedAt(null);

        User alreadyCheckedUser = new User();
        alreadyCheckedUser.setId(15L);
        alreadyCheckedUser.setUsername("again");
        alreadyCheckedUser.setEmail("again@example.com");
        alreadyCheckedUser.setRole(Role.USER);
        alreadyCheckedUser.setStreak(6);
        alreadyCheckedUser.setLastStudyDate(today.minusDays(1));
        alreadyCheckedUser.setStreakCheckedAt(today);

        when(userRepo.findAll()).thenReturn(List.of(todayStudyUser, alreadyCheckedUser));

        notificationService.resetInactiveStreaks();

        verifyNoInteractions(emailService);
        verify(userRepo, never()).save(todayStudyUser);
        verify(userRepo, never()).save(alreadyCheckedUser);
        assertEquals(5, todayStudyUser.getStreak());
        assertEquals(6, alreadyCheckedUser.getStreak());
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

    @Test
    void announceNewShopItem_ShouldIgnoreInactiveOrNullItems() {
        notificationService.announceNewShopItem(null);

        ShopItem inactiveItem = new ShopItem();
        inactiveItem.setId(101L);
        inactiveItem.setName("Inactive item");
        inactiveItem.setDescription("hidden");
        inactiveItem.setPrice(50);
        inactiveItem.setType(ItemType.VIP);
        inactiveItem.setDurationDays(7);
        inactiveItem.setActive(false);

        notificationService.announceNewShopItem(inactiveItem);

        verifyNoInteractions(emailService, userRepo);
    }
}
