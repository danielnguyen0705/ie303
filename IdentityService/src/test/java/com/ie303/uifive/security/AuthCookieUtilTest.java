package com.ie303.uifive.security;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class AuthCookieUtilTest {

    @Test
    void buildAuthCookie_usesConfiguredSecureModeForProxyDeployments() {
        HttpServletRequest request = new MockHttpServletRequest();

        String cookie = AuthCookieUtil.buildAuthCookie(
                "token-value",
                3600,
                request,
                true,
                "Lax");

        assertThat(cookie).contains("token=token-value");
        assertThat(cookie).contains("HttpOnly");
        assertThat(cookie).contains("Secure");
        assertThat(cookie).contains("SameSite=None");
    }

    @Test
    void buildAuthCookie_fallsBackToLaxWhenSecureIsDisabled() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setSecure(false);

        String cookie = AuthCookieUtil.buildAuthCookie(
                "token-value",
                3600,
                request,
                false,
                "Strict");

        assertThat(cookie).contains("token=token-value");
        assertThat(cookie).doesNotContain("Secure");
        assertThat(cookie).contains("SameSite=Strict");
    }

    @Test
    void buildAuthCookie_rejectsInvalidNoneSameSiteWhenNotSecure() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setSecure(false);

        String cookie = AuthCookieUtil.buildAuthCookie(
                "token-value",
                3600,
                request,
                false,
                "None");

        assertThat(cookie).doesNotContain("Secure");
        assertThat(cookie).contains("SameSite=Lax");
    }
}
