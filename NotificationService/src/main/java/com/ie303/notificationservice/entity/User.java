package com.ie303.notificationservice.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

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

    @Enumerated(EnumType.STRING)
    private Role role;

    private int streak;

    @Column(name = "last_study_date")
    private LocalDate lastStudyDate;

    @Column(name = "vip_expired_at")
    private LocalDateTime vipExpiredAt;

    @Column(name = "streak_item_pending_count")
    private int streakItemPendingCount;

    @Column(name = "streak_checked_at")
    private LocalDate streakCheckedAt;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    private boolean verified = false;
}
