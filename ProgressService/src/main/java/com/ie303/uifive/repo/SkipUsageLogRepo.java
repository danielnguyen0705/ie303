package com.ie303.uifive.repo;

import com.ie303.uifive.entity.SkipUsageLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface SkipUsageLogRepo extends JpaRepository<SkipUsageLog, Long> {

    List<SkipUsageLog> findByUserIdAndUsedAtGreaterThanEqualAndUsedAtLessThan(
            Long userId,
            LocalDateTime from,
            LocalDateTime to
    );
}
