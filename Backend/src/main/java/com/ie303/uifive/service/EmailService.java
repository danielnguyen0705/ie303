package com.ie303.uifive.service;

import com.ie303.uifive.entity.ShopItem;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {

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
        sendHtmlEmail(toEmail, "Account Verification", buildVerificationContent(verifyLink));
    }

    public void sendVipExpiryReminderEmail(String toEmail, String username, LocalDateTime vipExpiredAt, long daysRemaining) {
        String subject = "VIP cua ban sap het han";
        sendHtmlEmail(toEmail, subject, buildVipReminderContent(username, vipExpiredAt, daysRemaining));
    }

    public void sendStreakReminderEmail(String toEmail, String username, int streak, LocalDate lastStudyDate) {
        String subject = "Ban sap mat streak hoc tap";
        sendHtmlEmail(toEmail, subject, buildStreakReminderContent(username, streak, lastStudyDate));
    }

    public void sendNewShopItemAnnouncementEmail(String toEmail, ShopItem item) {
        String subject = "Vua co vat pham moi trong shop";
        sendHtmlEmail(toEmail, subject, buildNewShopItemContent(item));
    }

    private void sendHtmlEmail(String toEmail, String subject, String content) {
        try {
            if (resendApiKey == null || resendApiKey.isBlank()) {
                throw new AppException(ErrorCode.EMAIL_SEND_FAILED, "Resend API key is not configured");
            }

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
                throw new AppException(ErrorCode.EMAIL_SEND_FAILED, "Failed to send email");
            }
        } catch (IOException e) {
            log.error("Failed to send email to '{}' with subject '{}': {}", toEmail, subject, e.getMessage(), e);
            throw new AppException(ErrorCode.EMAIL_SEND_FAILED, "Failed to send email");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Failed to send email to '{}' with subject '{}': {}", toEmail, subject, e.getMessage(), e);
            throw new AppException(ErrorCode.EMAIL_SEND_FAILED, "Failed to send email");
        }
    }

    private String buildVerificationContent(String verifyLink) {
        return """
            <h2>Xác nhận tài khoản</h2>
            <p>Nhấn vào nút bên dưới để xác nhận email của bạn:</p>
            <a href="%s"
               style="display:inline-block;padding:12px 20px;background-color:#2563eb;color:white;
               text-decoration:none;border-radius:8px;font-weight:bold;">
               Xác nhận tài khoản
            </a>
            <p>Link có hiệu lực trong 5 phút.</p>
            """.formatted(verifyLink);
    }

    private String buildVipReminderContent(String username, LocalDateTime vipExpiredAt, long daysRemaining) {
        return """
            <h2>VIP sắp hết hạn</h2>
            <p>Chào %s,</p>
            <p>Tài khoản VIP của bạn sẽ hết hạn vào <strong>%s</strong>.</p>
            <p>Còn khoảng <strong>%d ngày</strong> nữa là VIP sẽ kết thúc.</p>
            <p>Hãy gia hạn sớm để không bị gián đoạn trải nghiệm.</p>
            """.formatted(
                escape(username),
                vipExpiredAt.format(DATE_TIME_FORMATTER),
                daysRemaining
        );
    }

    private String buildStreakReminderContent(String username, int streak, LocalDate lastStudyDate) {
        return """
            <h2>Bạn sắp mất streak</h2>
            <p>Chào %s,</p>
            <p>Streak hiện tại của bạn là <strong>%d</strong>.</p>
            <p>Bài học gần nhất của bạn là ngày <strong>%s</strong>.</p>
            <p>Hãy học trong hôm nay để giữ streak không bị reset.</p>
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
