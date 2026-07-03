package com.ie303.uifive.service;

import com.ie303.uifive.dto.auth.LoginRequest;
import com.ie303.uifive.entity.RevokedToken;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.repo.RevokedTokenRepo;
import com.ie303.uifive.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepo userRepository;
    private final RevokedTokenRepo revokedTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public String login(LoginRequest request) {
        User user = findUserByPrincipal(request.getUsername());

        if (!user.isVerified()) {
            throw new AppException(ErrorCode.ACCOUNT_NOT_VERIFIED);
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.INVALID_PASSWORD);
        }

        return jwtService.generateLoginToken(user);
    }

    public String refresh(String token) {
        if (token == null || token.isBlank()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        if (revokedTokenRepository.existsByToken(token)) {
            throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        String tokenUse = jwtService.extractTokenUseIgnoringExpiration(token);
        if (!"login".equals(tokenUse)) {
            throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        String subject = jwtService.extractUsernameIgnoringExpiration(token);
        if (subject == null || !jwtService.isTokenSignatureValid(token)) {
            throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        User user = findUserByPrincipal(subject);
        LocalDateTime expiresAt = jwtService.extractExpirationIgnoringExpiration(token);
        if (expiresAt == null) {
            throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        RevokedToken revokedToken = new RevokedToken();
        revokedToken.setToken(token);
        revokedToken.setExpiresAt(expiresAt);
        revokedTokenRepository.save(revokedToken);

        return jwtService.generateRefreshedToken(user);
    }

    public void logout(String token) {
        if (token == null || token.isBlank()) {
            return;
        }

        if (revokedTokenRepository.existsByToken(token)) {
            return;
        }

        LocalDateTime expiresAt = jwtService.extractExpirationIgnoringExpiration(token);
        if (expiresAt == null) {
            return;
        }

        RevokedToken revokedToken = new RevokedToken();
        revokedToken.setToken(token);
        revokedToken.setExpiresAt(expiresAt);
        revokedTokenRepository.save(revokedToken);
    }

    public void verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token);

        if (user == null) {
            throw new AppException(ErrorCode.INVALID_VERIFICATION_TOKEN);
        }

        if (user.isVerified()) {
            throw new AppException(ErrorCode.ACCOUNT_ALREADY_VERIFIED);
        }

        if (user.getVerificationExpiry().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.VERIFICATION_TOKEN_EXPIRED);
        }

        user.setVerified(true);
        user.setVerificationToken(null);
        user.setVerificationExpiry(null);

        userRepository.save(user);
    }

    private User findUserByPrincipal(String principal) {
        User user = userRepository.findByUsername(principal);
        if (user == null) {
            user = userRepository.findByEmail(principal);
            if (user == null) {
                throw new AppException(ErrorCode.INVALID_USERNAME);
            }
        }

        return user;
    }

}
