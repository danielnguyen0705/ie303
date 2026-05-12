package com.ie303.uifive.service;

import com.ie303.uifive.entity.ShopItem;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class EmailService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
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
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setFrom(fromEmail);
            helper.setSubject(subject);
            helper.setText(content, true);

            mailSender.send(message);
        } catch (MessagingException e) {
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
