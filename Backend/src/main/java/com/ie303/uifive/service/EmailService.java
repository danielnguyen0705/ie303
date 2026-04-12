package com.ie303.uifive.service;

import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendVerificationEmail(String toEmail, String verifyLink) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setFrom(fromEmail);
            helper.setSubject("Account Verification");

            String content = buildContent(verifyLink);
            helper.setText(content, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new AppException(ErrorCode.EMAIL_SEND_FAILED, "Failed to send verification email");
        }
    }

    private String buildContent(String verifyLink) {
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
}
