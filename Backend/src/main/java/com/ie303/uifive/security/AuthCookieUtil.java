package com.ie303.uifive.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseCookie;

import java.time.Duration;

public final class AuthCookieUtil {

    private static final String COOKIE_NAME = "token";

    private AuthCookieUtil() {
    }

    public static String buildAuthCookie(String token, int maxAgeSeconds, HttpServletRequest request) {
        boolean secure = isSecureRequest(request);
        String sameSite = secure ? "None" : "Lax";

        return ResponseCookie.from(COOKIE_NAME, token == null ? "" : token)
                .httpOnly(true)
                .path("/")
                .maxAge(Duration.ofSeconds(Math.max(0, maxAgeSeconds)))
                .sameSite(sameSite)
                .secure(secure)
                .build()
                .toString();
    }

    private static boolean isSecureRequest(HttpServletRequest request) {
        if (request == null) {
            return false;
        }

        if (request.isSecure()) {
            return true;
        }

        String forwardedProto = request.getHeader("X-Forwarded-Proto");
        return "https".equalsIgnoreCase(forwardedProto);
    }
}
