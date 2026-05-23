package com.ie303.uifive.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
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
    private String password;
    private String avatar;
    private String background;

    @Enumerated(EnumType.STRING)
    private Role role;

    private int coin;
    private int exp;
    private int score;
    private int streak;
    private boolean verified = false;

    @Column(name = "verification_token", length = 255)
    private String verificationToken;
    private LocalDateTime verificationExpiry;

    @Column(name = "last_study_date")
    private LocalDate lastStudyDate;

    @Column(name = "vip_expired_at")
    private LocalDateTime vipExpiredAt;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
