package com.ie303.uifive.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "quest_templates",
        uniqueConstraints = @UniqueConstraint(columnNames = {"quest_period", "quest_type"})
)
@Data
public class QuestTemplateEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "quest_period", nullable = false)
    private QuestPeriod questPeriod;

    @Enumerated(EnumType.STRING)
    @Column(name = "quest_type", nullable = false)
    private DailyQuestType questType;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "target_amount", nullable = false)
    private int targetAmount;

    @Column(name = "coins_reward", nullable = false)
    private int coinsReward;

    @Column(name = "exp_reward", nullable = false)
    private int expReward;

    @Enumerated(EnumType.STRING)
    @Column(name = "reward_item_type")
    private ItemType rewardItemType;

    @Column(name = "reward_item_quantity", nullable = false)
    private int rewardItemQuantity;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
