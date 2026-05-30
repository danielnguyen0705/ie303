package com.ie303.uifive.security.OAuth2Handler;

import com.ie303.uifive.entity.User;
import com.ie303.uifive.security.AuthCookieUtil;
import com.ie303.uifive.service.JwtService;
import com.ie303.uifive.service.UserService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final UserService userService;

    @Value("${app.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Value("${app.cookie-secure:false}")
    private boolean cookieSecure;

    @Value("${app.cookie-same-site:Lax}")
    private String cookieSameSite;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String subject = oAuth2User.getAttribute("sub");
        String principal = resolveOAuth2Principal(email, subject, name);
        String displayName = name == null || name.isBlank() ? principal : name;
        User user = userService.findOrCreateOAuth2User(principal, displayName);

        String token = jwtService.generateToken(user);
        response.addHeader("Set-Cookie",
                AuthCookieUtil.buildAuthCookie(token, 86400, request, cookieSecure, cookieSameSite));
        response.sendRedirect(frontendBaseUrl + "/oauth2/callback?status=success");
    }

    private String resolveOAuth2Principal(String email, String subject, String name) {
        if (email != null && !email.isBlank()) {
            return email.trim();
        }

        if (subject != null && !subject.isBlank()) {
            return subject.trim();
        }

        if (name != null && !name.isBlank()) {
            return name.trim();
        }

        return "google-user";
    }
}
