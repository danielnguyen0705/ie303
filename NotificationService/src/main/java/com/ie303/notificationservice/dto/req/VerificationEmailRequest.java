package com.ie303.notificationservice.dto.req;

public record VerificationEmailRequest(
        String toEmail,
        String verifyLink
) {
}
