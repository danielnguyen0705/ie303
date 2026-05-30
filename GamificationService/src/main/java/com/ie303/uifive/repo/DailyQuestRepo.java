package com.ie303.uifive.repo;

import com.ie303.uifive.entity.DailyQuest;
import com.ie303.uifive.entity.DailyQuestType;
import com.ie303.uifive.entity.QuestPeriod;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DailyQuestRepo extends JpaRepository<DailyQuest, Long> {
    List<DailyQuest> findByUserIdAndQuestDateOrderBySortOrderAsc(Long userId, LocalDate questDate);

    List<DailyQuest> findByUserIdAndQuestDateAndQuestTypeOrderBySortOrderAsc(
            Long userId,
            LocalDate questDate,
            DailyQuestType questType
    );

    List<DailyQuest> findByUserIdAndQuestDateAndQuestPeriodOrderBySortOrderAsc(
            Long userId,
            LocalDate questDate,
            QuestPeriod questPeriod
    );

    Optional<DailyQuest> findByIdAndUserId(Long id, Long userId);

    List<DailyQuest> findByUserIdAndClaimedAtIsNotNullOrderByClaimedAtAsc(Long userId);

    long countByUserIdAndClaimedAtIsNotNull(Long userId);

    long countByUserIdAndQuestDateAndClaimedAtIsNotNull(Long userId, LocalDate questDate);
}
