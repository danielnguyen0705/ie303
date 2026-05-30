package com.ie303.uifive.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseCookie;

import java.time.Duration;

public final class AuthCookieUtil {

    private static final String COOKIE_NAME = "token";

    private AuthCookieUtil() {
    }

    public static String buildAuthCookie(String token, int maxAgeSeconds, HttpServletRequest request) {
        return buildAuthCookie(token, maxAgeSeconds, request, false, "Lax");
    }

    public static String buildAuthCookie(String token,
                                         int maxAgeSeconds,
                                         HttpServletRequest request,
                                         boolean configuredSecure,
                                         String configuredSameSite) {
        boolean secure = configuredSecure || isSecureRequest(request);
        String sameSite = resolveSameSite(secure, configuredSameSite);

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

    private static String resolveSameSite(boolean secure, String configuredSameSite) {
        if (secure) {
            return "None";
        }

        if (configuredSameSite == null || configuredSameSite.isBlank()) {
            return "Lax";
        }

        String normalized = configuredSameSite.trim();
        if ("None".equalsIgnoreCase(normalized)) {
            return "Lax";
        }

        if ("Strict".equalsIgnoreCase(normalized)) {
            return "Strict";
        }

        return "Lax";
    }
}
