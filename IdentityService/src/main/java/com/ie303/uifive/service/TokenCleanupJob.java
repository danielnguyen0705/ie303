package com.ie303.uifive.service;

import com.ie303.uifive.repo.RevokedTokenRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class TokenCleanupJob {

    private final RevokedTokenRepo revokedTokenRepo;

    @Scheduled(fixedDelayString = "${auth.token-cleanup-interval-ms:3600000}")
    @Transactional
    public void deleteExpiredTokens() {
        LocalDateTime now = LocalDateTime.now();
        long deletedCount = revokedTokenRepo.deleteByExpiresAtBefore(now);

        if (deletedCount > 0) {
            log.info("Deleted {} expired token records at {}", deletedCount, now);
        }
    }
}
