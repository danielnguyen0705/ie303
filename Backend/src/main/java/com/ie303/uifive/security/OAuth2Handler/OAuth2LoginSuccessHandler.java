package com.ie303.uifive.security.OAuth2Handler;

import com.ie303.uifive.entity.User;
import com.ie303.uifive.service.JwtService;
import com.ie303.uifive.service.UserService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {
    private final JwtService jwtService;
    private final UserService userService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");

        User user = userService.findByEmailOrNull(email);

        if (user == null) {
            String name = oAuth2User.getAttribute("name");
            user = userService.createOAuth2User(email, name);
        }

        String token = jwtService.generateToken(user);

        response.setHeader(
                "Set-Cookie",
                "token=" + token + "; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax"
        );

        response.sendRedirect("http://localhost:5173/oauth2/success");
    }
}
