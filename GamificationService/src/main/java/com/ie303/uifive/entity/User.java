package com.ie303.uifive.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users")
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_name")
    private String username;

    private String email;
    private String password;
    private String avatar;
    private String background;

    @Enumerated(EnumType.STRING)
    private Role role;

    private int coin;
    private int exp;
    private int score;
    private Integer streak = 0;
    private boolean verified = false;

    @Column(name = "last_study_date")
    private LocalDate lastStudyDate;

    @Column(name = "verification_token", length = 255)
    private String verificationToken;

    @Column(name = "verification_expiry")
    private LocalDateTime verificationExpiry;

    @Column(name = "vip_expired_at")
    private LocalDateTime vipExpiredAt;

    @Column(name = "exp_boost_multiplier")
    private double expBoostMultiplier;

    @Column(name = "exp_boost_expired_at")
    private LocalDateTime expBoostExpiredAt;

    @Column(name = "streak_item_pending_count")
    private Integer streakItemPendingCount = 0;

    @Column(name = "streak_checked_at")
    private LocalDate streakCheckedAt;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "strong_skill")
    private String strongSkill;

    @Column(name = "weak_skill")
    private String weakSkill;

    @Column(name = "trend_label")
    private String trendLabel;

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private List<UserItem> userItems;
}
