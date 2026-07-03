package com.ie303.uifive.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseCookie;

import java.time.Duration;

public final class AuthCookieUtil {

    public static final String ACCESS_COOKIE_NAME = "token";
    private AuthCookieUtil() {
    }

    public static String buildAuthCookie(String token, int maxAgeSeconds, HttpServletRequest request) {
        return buildAccessCookie(token, maxAgeSeconds, request);
    }

    public static String buildAccessCookie(String token, int maxAgeSeconds, HttpServletRequest request) {
        return buildAuthCookie(token, maxAgeSeconds, request, false, "Lax");
    }

    public static String buildAuthCookie(String token,
                                         int maxAgeSeconds,
                                         HttpServletRequest request,
                                         boolean configuredSecure,
                                         String configuredSameSite) {
        return buildCookie(ACCESS_COOKIE_NAME, token, maxAgeSeconds, request, configuredSecure, configuredSameSite);
    }

    public static String buildCookie(String cookieName,
                                     String token,
                                     int maxAgeSeconds,
                                     HttpServletRequest request,
                                     boolean configuredSecure,
                                     String configuredSameSite) {
        boolean secure = configuredSecure || isSecureRequest(request);
        String sameSite = resolveSameSite(secure, configuredSameSite);

        return ResponseCookie.from(cookieName, token == null ? "" : token)
                .httpOnly(true)
                .path("/")
                .maxAge(Duration.ofSeconds(Math.max(0, maxAgeSeconds)))
                .sameSite(sameSite)
                .secure(secure)
                .build()
                .toString();
    }

    public static String getCookieValue(HttpServletRequest request, String cookieName) {
        if (request == null || request.getCookies() == null) {
            return null;
        }

        for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
            if (cookieName.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }

        return null;
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
