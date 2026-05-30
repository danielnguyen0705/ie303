package com.ie303.uifive.repo;

import com.ie303.uifive.entity.QuestPeriod;
import com.ie303.uifive.entity.DailyQuestType;
import com.ie303.uifive.entity.QuestTemplateEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QuestTemplateRepo extends JpaRepository<QuestTemplateEntity, Long> {
    long countByQuestPeriod(QuestPeriod questPeriod);

    Optional<QuestTemplateEntity> findByQuestPeriodAndQuestType(QuestPeriod questPeriod, DailyQuestType questType);

    List<QuestTemplateEntity> findByQuestPeriodOrderBySortOrderAsc(QuestPeriod questPeriod);

    List<QuestTemplateEntity> findByActiveTrueAndQuestPeriodOrderBySortOrderAsc(QuestPeriod questPeriod);

    List<QuestTemplateEntity> findAllByOrderByQuestPeriodAscSortOrderAsc();
}
