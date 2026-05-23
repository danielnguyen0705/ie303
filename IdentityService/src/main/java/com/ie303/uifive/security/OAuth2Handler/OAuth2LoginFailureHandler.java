package com.ie303.uifive.security.OAuth2Handler;

import com.ie303.uifive.security.AuthCookieUtil;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2LoginFailureHandler implements AuthenticationFailureHandler {

    @org.springframework.beans.factory.annotation.Value("${app.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                        HttpServletResponse response,
                                        AuthenticationException exception)
            throws IOException, ServletException {

        response.addHeader("Set-Cookie", AuthCookieUtil.buildAuthCookie("", 0, request));

        String redirectUrl = frontendBaseUrl + "/?oauth_error="
                + URLEncoder.encode(exception.getMessage(), StandardCharsets.UTF_8);

        response.sendRedirect(redirectUrl);
    }
}
