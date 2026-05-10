package com.ie303.uifive.service;

import com.ie303.uifive.dto.auth.LoginRequest;
import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.repo.UserRepo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepo userRepo;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    @Test
    void login_ShouldReturnToken_WhenCredentialsAreValid() {
        LoginRequest request = new LoginRequest();
        request.setUsername("alice");
        request.setPassword("raw-pass");

        User user = new User();
        user.setUsername("alice");
        user.setPassword("encoded-pass");
        user.setVerified(true);
        user.setRole(Role.USER);

        when(userRepo.findByUsername("alice")).thenReturn(user);
        when(passwordEncoder.matches("raw-pass", "encoded-pass")).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("jwt-token");

        String token = authService.login(request);

        assertEquals("jwt-token", token);
        verify(jwtService).generateToken(user);
    }

    @Test
    void login_ShouldThrow_WhenUsernameNotFound() {
        LoginRequest request = new LoginRequest();
        request.setUsername("missing-user");
        request.setPassword("raw-pass");

        when(userRepo.findByUsername("missing-user")).thenReturn(null);
        when(userRepo.findByEmail("missing-user")).thenReturn(null);

        AppException exception = assertThrows(AppException.class, () -> authService.login(request));

        assertEquals(ErrorCode.INVALID_USERNAME, exception.getErrorCode());
        verifyNoInteractions(passwordEncoder, jwtService);
    }

    @Test
    void login_ShouldThrow_WhenPasswordIsInvalid() {
        LoginRequest request = new LoginRequest();
        request.setUsername("alice");
        request.setPassword("wrong-pass");

        User user = new User();
        user.setUsername("alice");
        user.setPassword("encoded-pass");
        user.setVerified(true);
        user.setRole(Role.USER);

        when(userRepo.findByUsername("alice")).thenReturn(user);
        when(passwordEncoder.matches("wrong-pass", "encoded-pass")).thenReturn(false);

        AppException exception = assertThrows(AppException.class, () -> authService.login(request));

        assertEquals(ErrorCode.INVALID_PASSWORD, exception.getErrorCode());
        verifyNoInteractions(jwtService);
    }

    @Test
    void login_ShouldThrow_WhenAccountNotVerified() {
        LoginRequest request = new LoginRequest();
        request.setUsername("alice");
        request.setPassword("raw-pass");

        User user = new User();
        user.setUsername("alice");
        user.setPassword("encoded-pass");
        user.setVerified(false);

        when(userRepo.findByUsername("alice")).thenReturn(user);

        AppException exception = assertThrows(AppException.class, () -> authService.login(request));

        assertEquals(ErrorCode.ACCOUNT_NOT_VERIFIED, exception.getErrorCode());
    }

    @Test
    void verifyEmail_ShouldMarkUserAsVerifiedAndClearToken() {
        User user = new User();
        user.setVerified(false);
        user.setVerificationToken("token-123");
        user.setVerificationExpiry(LocalDateTime.now().plusMinutes(10));

        when(userRepo.findByVerificationToken("token-123")).thenReturn(user);

        authService.verifyEmail("token-123");

        assertEquals(true, user.isVerified());
        assertEquals(null, user.getVerificationToken());
        assertEquals(null, user.getVerificationExpiry());
        verify(userRepo).save(user);
    }

    @Test
    void verifyEmail_ShouldThrow_WhenTokenExpired() {
        User user = new User();
        user.setVerified(false);
        user.setVerificationToken("token-123");
        user.setVerificationExpiry(LocalDateTime.now().minusMinutes(10));

        when(userRepo.findByVerificationToken("token-123")).thenReturn(user);

        AppException exception = assertThrows(AppException.class, () -> authService.verifyEmail("token-123"));

        assertEquals(ErrorCode.VERIFICATION_TOKEN_EXPIRED, exception.getErrorCode());
    }
}
