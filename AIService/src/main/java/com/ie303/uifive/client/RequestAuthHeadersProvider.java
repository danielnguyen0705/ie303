package com.ie303.uifive.client;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Component
public class RequestAuthHeadersProvider {

    public HttpHeaders createAuthHeaders() {
        HttpHeaders headers = new HttpHeaders();
        HttpServletRequest request = currentRequest();
        if (request == null) {
            return headers;
        }

        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authorization != null && !authorization.isBlank()) {
            headers.set(HttpHeaders.AUTHORIZATION, authorization);
            return headers;
        }

        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return headers;
        }

        String token = null;
        for (Cookie cookie : cookies) {
            if ("token".equals(cookie.getName()) && cookie.getValue() != null && !cookie.getValue().isBlank()) {
                token = cookie.getValue();
                break;
            }
        }

        if (token != null) {
            headers.add(HttpHeaders.COOKIE, "token=" + token);
        }

        return headers;
    }

    private HttpServletRequest currentRequest() {
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        if (!(attributes instanceof ServletRequestAttributes servletRequestAttributes)) {
            return null;
        }

        return servletRequestAttributes.getRequest();
    }
}
