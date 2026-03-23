package com.ie303.uifive.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
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

    @Enumerated(EnumType.STRING)
    private Role role;

    private int coin;
    private int score;
    private int streak;

    @Column(name = "last_study_date")
    private LocalDate lastStudyDate;

    @Column(name = "vip_expired_at")
    private LocalDateTime vipExpiredAt;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<UserLessonProgress> lessonProgresses;
}