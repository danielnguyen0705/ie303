package com.ie303.uifive.service;

import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.User;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.text.ParseException;
import java.util.Date;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @Value("${jwt.refresh-expiration:604800000}")
    private long refreshJwtExpiration;

    public long getJwtExpirationMs() {
        return jwtExpiration;
    }

    public long getRefreshTokenExpirationMs() {
        return refreshJwtExpiration;
    }

    public String generateLoginToken(User user) {
        return generateToken(user, jwtExpiration, "login");
    }

    public String generateRefreshedToken(User user) {
        return generateToken(user, refreshJwtExpiration, "refresh");
    }

    public boolean isTokenValid(String token, String username) {
        try {
            SignedJWT signedJWT = parseAndVerify(token);
            if (signedJWT == null) {
                return false;
            }

            JWTClaimsSet claimsSet = signedJWT.getJWTClaimsSet();
            String subject = claimsSet.getSubject();
            Date expiration = claimsSet.getExpirationTime();

            return subject != null
                    && subject.equals(username)
                    && expiration != null
                    && expiration.after(new Date());
        } catch (ParseException | JOSEException exception) {
            return false;
        }
    }

    public boolean isTokenSignatureValid(String token) {
        try {
            return parseAndVerify(token) != null;
        } catch (ParseException | JOSEException exception) {
            return false;
        }
    }

    public String extractUsernameIgnoringExpiration(String token) {
        try {
            SignedJWT signedJWT = parseAndVerify(token);
            if (signedJWT == null) {
                return null;
            }

            return signedJWT.getJWTClaimsSet().getSubject();
        } catch (ParseException | JOSEException exception) {
            return null;
        }
    }

    public LocalDateTime extractExpirationIgnoringExpiration(String token) {
        try {
            SignedJWT signedJWT = parseAndVerify(token);
            if (signedJWT == null) {
                return null;
            }

            Date expiration = signedJWT.getJWTClaimsSet().getExpirationTime();
            if (expiration == null) {
                return null;
            }

            return LocalDateTime.ofInstant(expiration.toInstant(), ZoneId.systemDefault());
        } catch (ParseException | JOSEException exception) {
            return null;
        }
    }

    public String extractTokenUseIgnoringExpiration(String token) {
        try {
            SignedJWT signedJWT = parseAndVerify(token);
            if (signedJWT == null) {
                return null;
            }

            return signedJWT.getJWTClaimsSet().getStringClaim("token_use");
        } catch (ParseException | JOSEException exception) {
            return null;
        }
    }

    private SignedJWT parseAndVerify(String token) throws ParseException, JOSEException {
        if (token == null || token.isBlank()) {
            return null;
        }

        SignedJWT signedJWT = SignedJWT.parse(token);
        if (!signedJWT.verify(new MACVerifier(getSigningKeyBytes()))) {
            return null;
        }

        return signedJWT;
    }

    public String generateToken(User user, long expirationMs, String tokenUse) {
        Date now = new Date();
        Date expiration = new Date(now.getTime() + expirationMs);

        JWTClaimsSet.Builder claimsBuilder = new JWTClaimsSet.Builder()
                .subject(user.getUsername())
                .issueTime(now)
                .expirationTime(expiration)
                .claim("token_use", tokenUse);

        Role role = user.getRole() == null ? Role.USER : user.getRole();
        claimsBuilder.claim("role", role.name());

        SignedJWT signedJWT = new SignedJWT(
                new JWSHeader(JWSAlgorithm.HS256),
                claimsBuilder.build()
        );

        try {
            signedJWT.sign(new com.nimbusds.jose.crypto.MACSigner(getSigningKeyBytes()));
            return signedJWT.serialize();
        } catch (JOSEException exception) {
            throw new IllegalStateException("Unable to sign JWT", exception);
        }
    }

    private byte[] getSigningKeyBytes() {
        return secretKey.getBytes(StandardCharsets.UTF_8);
    }
}
