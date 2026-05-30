package com.ie303.uifive.service;

import com.ie303.uifive.dto.req.QuestTemplateRequest;
import com.ie303.uifive.dto.res.QuestTemplateResponse;
import com.ie303.uifive.entity.DailyQuestType;
import com.ie303.uifive.entity.ItemType;
import com.ie303.uifive.entity.QuestPeriod;
import com.ie303.uifive.entity.QuestTemplateEntity;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import com.ie303.uifive.repo.QuestTemplateRepo;
import jakarta.annotation.PostConstruct;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class QuestTemplateService {

    private final QuestTemplateRepo questTemplateRepo;

    @PostConstruct
    public void seedDefaults() {
        if (questTemplateRepo.count() == 0) {
            questTemplateRepo.saveAll(defaultTemplates());
        }
    }

    public List<QuestTemplateEntity> getAllTemplates() {
        seedDefaults();
        return questTemplateRepo.findAllByOrderByQuestPeriodAscSortOrderAsc();
    }

    public List<QuestTemplateEntity> getActiveTemplates(QuestPeriod period) {
        seedDefaults();
        return questTemplateRepo.findByActiveTrueAndQuestPeriodOrderBySortOrderAsc(period);
    }

    public QuestTemplateEntity getById(Long id) {
        return questTemplateRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_REQUEST, "Quest template not found"));
    }

    @Caching(evict = {
            @CacheEvict(cacheNames = {
                    "quest-templates-all",
                    "quest-templates-active",
                    "quest-templates-by-id",
                    "daily-quests",
                    "daily-quest-by-id",
                    "daily-quest-stats",
                    "quest-badges"
            }, allEntries = true)
    })
    public QuestTemplateEntity create(QuestTemplateRequest request) {
        validate(request);

        QuestTemplateEntity template = questTemplateRepo
                .findByQuestPeriodAndQuestType(request.questPeriod(), request.questType())
                .orElseGet(QuestTemplateEntity::new);
        applyRequest(template, request);
        return questTemplateRepo.save(template);
    }

    @Caching(evict = {
            @CacheEvict(cacheNames = {
                    "quest-templates-all",
                    "quest-templates-active",
                    "quest-templates-by-id",
                    "daily-quests",
                    "daily-quest-by-id",
                    "daily-quest-stats",
                    "quest-badges"
            }, allEntries = true)
    })
    public QuestTemplateEntity update(Long id, QuestTemplateRequest request) {
        validate(request);

        QuestTemplateEntity template = getById(id);
        applyRequest(template, request);
        return questTemplateRepo.save(template);
    }

    @Caching(evict = {
            @CacheEvict(cacheNames = {
                    "quest-templates-all",
                    "quest-templates-active",
                    "quest-templates-by-id",
                    "daily-quests",
                    "daily-quest-by-id",
                    "daily-quest-stats",
                    "quest-badges"
            }, allEntries = true)
    })
    public void deactivate(Long id) {
        QuestTemplateEntity template = getById(id);
        template.setActive(false);
        questTemplateRepo.save(template);
    }

    public QuestTemplateResponse toResponse(QuestTemplateEntity entity) {
        return new QuestTemplateResponse(
                entity.getId(),
                entity.getQuestPeriod(),
                entity.getQuestType(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getTargetAmount(),
                entity.getCoinsReward(),
                entity.getExpReward(),
                entity.getRewardItemType(),
                entity.getRewardItemQuantity(),
                entity.getSortOrder(),
                entity.isActive()
        );
    }

    public List<QuestTemplateResponse> toResponseList(List<QuestTemplateEntity> entities) {
        return entities.stream().map(this::toResponse).toList();
    }

    private void applyRequest(QuestTemplateEntity template, QuestTemplateRequest request) {
        template.setQuestPeriod(request.questPeriod());
        template.setQuestType(request.questType());
        template.setTitle(request.title().trim());
        template.setDescription(request.description().trim());
        template.setTargetAmount(request.targetAmount());
        template.setCoinsReward(request.coinsReward());
        template.setExpReward(request.expReward());
        template.setRewardItemType(request.rewardItemType());
        template.setRewardItemQuantity(request.rewardItemQuantity());
        template.setSortOrder(request.sortOrder());
        template.setActive(request.active());
    }

    private void validate(QuestTemplateRequest request) {
        if (request.questPeriod() == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Quest period is required");
        }

        if (request.questType() == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Quest type is required");
        }

        if (request.targetAmount() <= 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Target amount must be greater than 0");
        }

        if (request.coinsReward() < 0 || request.expReward() < 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Rewards must be non-negative");
        }

        if (request.rewardItemType() == null && request.rewardItemQuantity() > 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Reward item type is required when quantity is set");
        }
    }

    private List<QuestTemplateEntity> defaultTemplates() {
        List<QuestTemplateEntity> templates = new ArrayList<>();

        templates.add(buildDefault(
                QuestPeriod.DAILY,
                DailyQuestType.LESSON_COMPLETION,
                "Finish 2 lessons",
                "Complete 2 lessons today to stay on track.",
                2,
                60,
                120,
                ItemType.SKIP,
                1,
                1
        ));
        templates.add(buildDefault(
                QuestPeriod.DAILY,
                DailyQuestType.QUESTION_ANSWERING,
                "Answer 15 questions",
                "Answer 15 questions today and sharpen your skills.",
                15,
                40,
                80,
                null,
                0,
                2
        ));
        templates.add(buildDefault(
                QuestPeriod.DAILY,
                DailyQuestType.SKIP_USAGE,
                "Use SKIP once",
                "Use one SKIP item today to protect your streak.",
                1,
                20,
                40,
                null,
                0,
                3
        ));
        templates.add(buildDefault(
                QuestPeriod.WEEKLY,
                DailyQuestType.LESSON_COMPLETION,
                "Finish 10 lessons",
                "Complete 10 lessons this week for a big reward.",
                10,
                180,
                320,
                ItemType.SKIP,
                2,
                1
        ));
        templates.add(buildDefault(
                QuestPeriod.WEEKLY,
                DailyQuestType.QUESTION_ANSWERING,
                "Answer 100 questions",
                "Answer 100 questions this week to build momentum.",
                100,
                220,
                420,
                null,
                0,
                2
        ));
        templates.add(buildDefault(
                QuestPeriod.WEEKLY,
                DailyQuestType.SKIP_USAGE,
                "Use SKIP 3 times",
                "Use 3 SKIP items this week to save your streak.",
                3,
                140,
                260,
                null,
                0,
                3
        ));

        return templates;
    }

    private QuestTemplateEntity buildDefault(
            QuestPeriod period,
            DailyQuestType type,
            String title,
            String description,
            int targetAmount,
            int coinsReward,
            int expReward,
            ItemType rewardItemType,
            int rewardItemQuantity,
            int sortOrder
    ) {
        QuestTemplateEntity entity = new QuestTemplateEntity();
        entity.setQuestPeriod(period);
        entity.setQuestType(type);
        entity.setTitle(title);
        entity.setDescription(description);
        entity.setTargetAmount(targetAmount);
        entity.setCoinsReward(coinsReward);
        entity.setExpReward(expReward);
        entity.setRewardItemType(rewardItemType);
        entity.setRewardItemQuantity(rewardItemQuantity);
        entity.setSortOrder(sortOrder);
        entity.setActive(true);
        return entity;
    }
}
