package com.ie303.uifive.service;

import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.ShopItem;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final UserRepo userRepo;
    private final EmailService emailService;

    @Value("${notification.time-zone:Asia/Ho_Chi_Minh}")
    private String notificationTimeZone;

    @Value("${notification.vip-reminder.days-before:3}")
    private int vipReminderDaysBefore;

    @Scheduled(cron = "${notification.vip-reminder.cron:0 0 9 * * *}", zone = "${notification.time-zone:Asia/Ho_Chi_Minh}")
    public void sendVipExpiryReminders() {
        ZoneId zoneId = ZoneId.of(notificationTimeZone);
        LocalDateTime now = LocalDateTime.now(zoneId);
        LocalDate today = LocalDate.now(zoneId);
        List<User> users = findNotificationCandidates();

        for (User user : users) {
            if (user.getVipExpiredAt() == null || !user.getVipExpiredAt().isAfter(now)) {
                continue;
            }

            long daysRemaining = ChronoUnit.DAYS.between(today, user.getVipExpiredAt().toLocalDate());
            if (daysRemaining < 0 || daysRemaining > vipReminderDaysBefore) {
                continue;
            }

            sendSafely(user, () -> emailService.sendVipExpiryReminderEmail(
                    user.getEmail(),
                    displayName(user),
                    user.getVipExpiredAt(),
                    daysRemaining
            ));
        }
    }

    @Scheduled(cron = "${notification.streak-reminder.cron:0 0 9 * * *}", zone = "${notification.time-zone:Asia/Ho_Chi_Minh}")
    public void sendStreakReminders() {
        LocalDate today = LocalDate.now(ZoneId.of(notificationTimeZone));
        List<User> users = findAllUsers();

        for (User user : users) {
            if (user.getLastStudyDate() == null) {
                continue;
            }

            long daysSinceStudy = ChronoUnit.DAYS.between(user.getLastStudyDate(), today);
            if (daysSinceStudy != 1) {
                continue;
            }

            if (user.getStreak() <= 0) {
                continue;
            }

            if (user.getStreakItemPendingCount() > 0) {
                continue;
            }

            sendSafely(user, () -> emailService.sendStreakReminderEmail(
                    user.getEmail(),
                    displayName(user),
                    user.getStreak(),
                    user.getLastStudyDate()
            ));
        }
    }

    @Scheduled(cron = "${notification.streak-reset.cron:0 5 0 * * *}", zone = "${notification.time-zone:Asia/Ho_Chi_Minh}")
    public void resetInactiveStreaks() {
        LocalDate today = LocalDate.now(ZoneId.of(notificationTimeZone));
        List<User> users = findAllUsers();
        int recheckedUsers = 0;
        int resetUsers = 0;
        int freezeConsumedUsers = 0;

        for (User user : users) {
            if (user.getLastStudyDate() == null) {
                continue;
            }

            if (!user.getLastStudyDate().isBefore(today)) {
                continue;
            }

            if (user.getStreak() <= 0) {
                continue;
            }

            LocalDate lastCheckedDate = user.getStreakCheckedAt();
            if (lastCheckedDate != null && !lastCheckedDate.isBefore(today)) {
                continue;
            }

            recheckedUsers++;

            if (user.getStreakItemPendingCount() > 0) {
                user.setStreakItemPendingCount(user.getStreakItemPendingCount() - 1);
                user.setStreakCheckedAt(today);
                userRepo.save(user);
                freezeConsumedUsers++;
                continue;
            }

            user.setStreak(0);
            user.setStreakCheckedAt(today);
            userRepo.save(user);
            resetUsers++;
        }

        log.info(
                "Streak reset job completed at {}: scanned {} users, rechecked {}, reset {}, consumed freeze for {}",
                today,
                users.size(),
                recheckedUsers,
                resetUsers,
                freezeConsumedUsers
        );
    }

    @Async
    public void announceNewShopItem(ShopItem item) {
        if (item == null || !item.isActive()) {
            return;
        }

        List<User> users = findNotificationCandidates();

        for (User user : users) {
            sendSafely(user, () -> emailService.sendNewShopItemAnnouncementEmail(user.getEmail(), item));
        }
    }

    private List<User> findNotificationCandidates() {
        return userRepo.findByRoleAndEmailIsNotNull(Role.USER)
                .stream()
                .filter(user -> user.getEmail() != null && !user.getEmail().isBlank())
                .toList();
    }

    private List<User> findAllUsers() {
        return userRepo.findByRole(Role.USER);
    }

    private void sendSafely(User user, Runnable action) {
        try {
            action.run();
        } catch (RuntimeException ex) {
            log.warn("Failed to send notification email to userId={}, email={}", user.getId(), user.getEmail(), ex);
        }
    }

    private String displayName(User user) {
        if (user.getUsername() != null && !user.getUsername().isBlank()) {
            return user.getUsername();
        }

        return user.getEmail();
    }
}
