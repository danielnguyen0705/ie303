package com.ie303.uifive.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;


@Entity
@Table(
        name = "daily_quests",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "quest_date", "quest_type"})
)
@Data
public class DailyQuest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "quest_date", nullable = false)
    private LocalDate questDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "quest_type", nullable = false)
    private DailyQuestType questType;

    @Enumerated(EnumType.STRING)
    @Column(name = "quest_period", nullable = false)
    private QuestPeriod questPeriod = QuestPeriod.DAILY;

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

    @Column(name = "claimed_at")
    private LocalDateTime claimedAt;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
