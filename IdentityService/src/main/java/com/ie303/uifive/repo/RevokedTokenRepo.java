package com.ie303.uifive.repo;

import com.ie303.uifive.entity.RevokedToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface RevokedTokenRepo extends JpaRepository<RevokedToken, Long> {
    boolean existsByToken(String token);
    Optional<RevokedToken> findByToken(String token);
    long deleteByExpiresAtBefore(LocalDateTime cutoff);
}
