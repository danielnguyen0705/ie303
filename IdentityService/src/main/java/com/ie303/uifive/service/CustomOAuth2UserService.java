package com.ie303.uifive.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserService userService;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String subject = oAuth2User.getAttribute("sub");

        String principal = resolveOAuth2Principal(email, subject, name);
        if (principal == null || principal.isBlank()) {
            throw new OAuth2AuthenticationException("Unable to resolve OAuth2 principal");
        }

        userService.findOrCreateOAuth2User(principal, name == null || name.isBlank() ? principal : name);

        return oAuth2User;
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

        return null;
    }
}
