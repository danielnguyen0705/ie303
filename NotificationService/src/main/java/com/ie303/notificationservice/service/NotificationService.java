package com.ie303.notificationservice.service;

import com.ie303.notificationservice.dto.req.PaymentCompletedRequest;
import com.ie303.notificationservice.dto.req.ShopItemAnnouncementRequest;
import com.ie303.notificationservice.dto.req.VerificationEmailRequest;
import com.ie303.notificationservice.entity.Role;
import com.ie303.notificationservice.entity.ShopItem;
import com.ie303.notificationservice.entity.User;
import com.ie303.notificationservice.messaging.RabbitMessagingConfig;
import com.ie303.notificationservice.repo.ShopItemRepo;
import com.ie303.notificationservice.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final UserRepo userRepo;
    private final ShopItemRepo shopItemRepo;
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

            if (!isValidEmail(user.getEmail())) {
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
    public void announceNewShopItem(Long itemId) {
        if (itemId == null) {
            return;
        }

        ShopItem item = shopItemRepo.findById(itemId)
                .orElse(null);

        if (item == null || !item.isActive()) {
            return;
        }

        List<User> users = findNotificationCandidates();

        for (User user : users) {
            sendSafely(user, () -> emailService.sendNewShopItemAnnouncementEmail(user.getEmail(), item));
        }
    }

    @RabbitListener(queues = RabbitMessagingConfig.VERIFICATION_EMAIL_QUEUE)
    public void sendVerificationEmail(VerificationEmailRequest request) {
        if (request == null) {
            return;
        }

        try {
            log.info("Consumed verification email event from RabbitMQ for {}", request.toEmail());
            emailService.sendVerificationEmail(request.toEmail(), request.verifyLink());
        } catch (RuntimeException ex) {
            log.warn("Failed to process verification email event for email={}", request.toEmail(), ex);
        }
    }

    public void sendVerificationEmail(String toEmail, String verifyLink) {
        sendVerificationEmail(new VerificationEmailRequest(toEmail, verifyLink));
    }

    @RabbitListener(queues = RabbitMessagingConfig.SHOP_ITEM_CREATED_QUEUE)
    public void sendShopItemAnnouncement(ShopItemAnnouncementRequest request) {
        if (request == null) {
            return;
        }

        try {
            log.info("Consumed shop item announcement event from RabbitMQ for itemId={}", request.itemId());
            ShopItem item = toShopItem(request);
            List<User> users = findNotificationCandidates();
            for (User user : users) {
                sendSafely(user, () -> emailService.sendNewShopItemAnnouncementEmail(user.getEmail(), item));
            }
        } catch (RuntimeException ex) {
            log.warn("Failed to process shop item announcement event for itemId={}", request.itemId(), ex);
        }
    }

    @RabbitListener(queues = RabbitMessagingConfig.PAYMENT_COMPLETED_QUEUE)
    public void sendPaymentCompleted(PaymentCompletedRequest request) {
        if (request == null) {
            return;
        }

        try {
            log.info("Consumed payment completed event from RabbitMQ for transactionCode={}", request.transactionCode());
            String toEmail = request.email();
            if ((toEmail == null || toEmail.isBlank()) && request.username() != null && !request.username().isBlank()) {
                toEmail = userRepo.findByUsername(request.username())
                        .map(User::getEmail)
                        .filter(this::isValidEmail)
                        .orElse(null);
            }

            if (!isValidEmail(toEmail)) {
                log.warn("Skipping payment completed email for transactionCode={} because recipient email is missing",
                        request.transactionCode());
                return;
            }

            emailService.sendPaymentCompletedEmail(
                    toEmail,
                    request.username(),
                    request.transactionCode(),
                    request.type(),
                    request.provider(),
                    request.amountMoney(),
                    request.amountCoin(),
                    request.durationDays(),
                    request.status(),
                    request.providerTransactionId()
            );
        } catch (RuntimeException ex) {
            log.warn("Failed to process payment completed event for transactionCode={}", request.transactionCode(), ex);
        }
    }

    private List<User> findNotificationCandidates() {
        return userRepo.findByRoleAndEmailIsNotNull(Role.USER)
                .stream()
                .filter(user -> isValidEmail(user.getEmail()))
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

    private ShopItem toShopItem(ShopItemAnnouncementRequest request) {
        ShopItem item = new ShopItem();
        item.setId(request.itemId());
        item.setName(request.name());
        item.setDescription(request.description());
        item.setPrice(request.price() == null ? 0 : request.price());
        item.setType(request.type() == null ? null : com.ie303.notificationservice.entity.ItemType.valueOf(request.type()));
        item.setDurationDays(request.durationDays());
        item.setExpMultiplier(request.expMultiplier());
        item.setActive(request.active() == null || request.active());
        return item;
    }

    private boolean isValidEmail(String email) {
        return email != null && EMAIL_PATTERN.matcher(email.trim()).matches();
    }
}
