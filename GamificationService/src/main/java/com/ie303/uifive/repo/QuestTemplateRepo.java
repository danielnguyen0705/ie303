package com.ie303.uifive.repo;

import com.ie303.uifive.entity.QuestPeriod;
import com.ie303.uifive.entity.QuestTemplateEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestTemplateRepo extends JpaRepository<QuestTemplateEntity, Long> {
    long countByQuestPeriod(QuestPeriod questPeriod);

    List<QuestTemplateEntity> findByQuestPeriodOrderBySortOrderAsc(QuestPeriod questPeriod);

    List<QuestTemplateEntity> findByActiveTrueAndQuestPeriodOrderBySortOrderAsc(QuestPeriod questPeriod);

    List<QuestTemplateEntity> findAllByOrderByQuestPeriodAscSortOrderAsc();
}
