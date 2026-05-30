package com.ie303.notificationservice.service;

import com.ie303.notificationservice.entity.ShopItem;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern DISPLAY_NAME_EMAIL_PATTERN = Pattern.compile("^.*<([^<>\\s@]+@[^<>\\s@]+\\.[^<>\\s@]+)>\\s*$");
    private static final Object RATE_LIMIT_LOCK = new Object();
    private static final long MIN_SEND_INTERVAL_MS = 550L;
    private static long nextAllowedSendAtMs = 0L;

    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(java.time.Duration.ofSeconds(20))
            .build();

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final ObjectMapper objectMapper;

    @Value("${resend.api-key:}")
    private String resendApiKey;

    @Value("${resend.api-url:https://api.resend.com/emails}")
    private String resendApiUrl;

    @Value("${resend.from-email:noreply@uifive.local}")
    private String fromEmail;

    public void sendVerificationEmail(String toEmail, String verifyLink) {
        sendHtmlEmail(toEmail, "Xac nhan tai khoan", buildVerificationContent(verifyLink));
    }

    public void sendVipExpiryReminderEmail(String toEmail, String username, LocalDateTime vipExpiredAt, long daysRemaining) {
        sendHtmlEmail(toEmail, "VIP cua ban sap het han", buildVipReminderContent(username, vipExpiredAt, daysRemaining));
    }

    public void sendStreakReminderEmail(String toEmail, String username, int streak, LocalDate lastStudyDate) {
        sendHtmlEmail(toEmail, "Ban sap mat streak hoc tap", buildStreakReminderContent(username, streak, lastStudyDate));
    }

    public void sendNewShopItemAnnouncementEmail(String toEmail, ShopItem item) {
        sendHtmlEmail(toEmail, "Vua co vat pham moi trong shop", buildNewShopItemContent(item));
    }

    public void sendPaymentCompletedEmail(String toEmail,
                                          String username,
                                          String transactionCode,
                                          String type,
                                          String provider,
                                          Integer amountMoney,
                                          Integer amountCoin,
                                          Integer durationDays,
                                          String status,
                                          String providerTransactionId) {
        sendHtmlEmail(toEmail, "Thanh toan hoan tat", buildPaymentCompletedContent(
                username,
                transactionCode,
                type,
                provider,
                amountMoney,
                amountCoin,
                durationDays,
                status,
                providerTransactionId
        ));
    }

    private void sendHtmlEmail(String toEmail, String subject, String content) {
        try {
            if (resendApiKey == null || resendApiKey.isBlank()) {
                throw new IllegalStateException("Resend API key is not configured");
            }

            if (fromEmail == null || fromEmail.isBlank()) {
                throw new IllegalStateException("Resend sender email is not configured");
            }

            if (!isValidEmail(toEmail)) {
                throw new IllegalStateException("Recipient email is invalid: " + toEmail);
            }

            if (!isValidSenderEmail(fromEmail)) {
                throw new IllegalStateException("Resend sender email is invalid: " + fromEmail);
            }

            enforceSendRateLimit();

            Map<String, Object> payload = Map.of(
                    "from", fromEmail,
                    "to", List.of(toEmail),
                    "subject", subject,
                    "html", content
            );

            String body = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(resendApiUrl))
                    .timeout(java.time.Duration.ofSeconds(20))
                    .header("Authorization", "Bearer " + resendApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.error("Resend API returned status {} for '{}' with subject '{}': {}",
                        response.statusCode(), toEmail, subject, response.body());
                throw new IllegalStateException("Failed to send email");
            }
        } catch (IOException e) {
            log.error("Failed to send email to '{}' with subject '{}': {}", toEmail, subject, e.getMessage(), e);
            throw new IllegalStateException("Failed to send email", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Failed to send email to '{}' with subject '{}': {}", toEmail, subject, e.getMessage(), e);
            throw new IllegalStateException("Failed to send email", e);
        }
    }

    private void enforceSendRateLimit() throws InterruptedException {
        synchronized (RATE_LIMIT_LOCK) {
            long now = System.currentTimeMillis();
            long waitMs = nextAllowedSendAtMs - now;
            if (waitMs > 0) {
                Thread.sleep(waitMs);
            }
            nextAllowedSendAtMs = Math.max(System.currentTimeMillis(), nextAllowedSendAtMs) + MIN_SEND_INTERVAL_MS;
        }
    }

    private boolean isValidEmail(String email) {
        return email != null && EMAIL_PATTERN.matcher(email.trim()).matches();
    }

    private boolean isValidSenderEmail(String sender) {
        if (sender == null || sender.isBlank()) {
            return false;
        }

        String trimmed = sender.trim();
        if (isValidEmail(trimmed)) {
            return true;
        }

        return DISPLAY_NAME_EMAIL_PATTERN.matcher(trimmed).matches();
    }

    private String buildVipReminderContent(String username, LocalDateTime vipExpiredAt, long daysRemaining) {
        return """
            <h2>VIP sap het han</h2>
            <p>Chao %s,</p>
            <p>Vip het han vao <strong>%s</strong>.</p>
            <p>Con khoang <strong>%d ngay</strong> nua.</p>
            """.formatted(
                escape(username),
                vipExpiredAt.format(DATE_TIME_FORMATTER),
                daysRemaining
        );
    }

    private String buildVerificationContent(String verifyLink) {
        return """
            <h2>Xac nhan tai khoan</h2>
            <p>Nhấn vào nút bên dưới để xác nhận email của bạn:</p>
            <a href="%s"
               style="display:inline-block;padding:12px 20px;background-color:#2563eb;color:white;
               text-decoration:none;border-radius:8px;font-weight:bold;">
               Xác nhận tài khoản
            </a>
            <p>Link có hiệu lực trong 5 phút.</p>
            """.formatted(escape(verifyLink));
    }

    private String buildStreakReminderContent(String username, int streak, LocalDate lastStudyDate) {
        return """
            <h2>Ban sap mat streak</h2>
            <p>Chao %s,</p>
            <p>Streak hien tai cua ban la <strong>%d</strong>.</p>
            <p>Bai hoc gan nhat cua ban la ngay <strong>%s</strong>.</p>
            """.formatted(
                escape(username),
                streak,
                lastStudyDate.format(DATE_FORMATTER)
        );
    }

    private String buildNewShopItemContent(ShopItem item) {
        String durationText = item.getDurationDays() == null ? "N/A" : item.getDurationDays() + " ngay";
        String multiplierText = item.getExpMultiplier() == null ? "N/A" : String.format(Locale.ROOT, "%.1fx", item.getExpMultiplier());

        return """
            <h2>Co vat pham moi vua duoc dang len</h2>
            <p><strong>%s</strong> da co mat trong shop.</p>
            <p>Mo ta: %s</p>
            <p>Gia: <strong>%d</strong> coin</p>
            <p>Loai: %s</p>
            <p>Thoi han: %s</p>
            <p>EXP multiplier: %s</p>
            """.formatted(
                escape(item.getName()),
                escape(item.getDescription()),
                item.getPrice(),
                item.getType(),
                durationText,
                multiplierText
        );
    }

    private String buildPaymentCompletedContent(String username,
                                                String transactionCode,
                                                String type,
                                                String provider,
                                                Integer amountMoney,
                                                Integer amountCoin,
                                                Integer durationDays,
                                                String status,
                                                String providerTransactionId) {
        String moneyText = amountMoney == null ? "N/A" : amountMoney + " VND";
        String coinText = amountCoin == null ? "N/A" : amountCoin + " coin";
        String durationText = durationDays == null ? "N/A" : durationDays + " ngay";

        return """
            <h2>Thanh toan hoan tat</h2>
            <p>Chao %s,</p>
            <p>Giao dich <strong>%s</strong> da duoc xu ly thanh cong.</p>
            <p>Loai giao dich: <strong>%s</strong></p>
            <p>Cong thanh toan: <strong>%s</strong></p>
            <p>So tien: <strong>%s</strong></p>
            <p>So coin: <strong>%s</strong></p>
            <p>Thoi han: <strong>%s</strong></p>
            <p>Trang thai: <strong>%s</strong></p>
            <p>Ma provider: <strong>%s</strong></p>
            """.formatted(
                escape(username),
                escape(transactionCode),
                escape(type),
                escape(provider),
                escape(moneyText),
                escape(coinText),
                escape(durationText),
                escape(status),
                escape(providerTransactionId)
        );
    }

    private String escape(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
