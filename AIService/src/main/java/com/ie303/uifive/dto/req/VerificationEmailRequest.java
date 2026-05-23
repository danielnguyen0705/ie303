package com.ie303.uifive.dto.req;

public record VerificationEmailRequest(
        String toEmail,
        String verifyLink
) {
}
