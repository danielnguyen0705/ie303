package com.ie303.uifive.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_unit_progress")
@Data
public class UserUnitProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private boolean completed;

    @Column(name = "progress_percent")
    private double progressPercent;

    @Column(name = "unlocked_at")
    @CreationTimestamp
    private LocalDateTime unlockedAt;

    @ManyToOne
    private User user;

    @ManyToOne
    private Unit unit;
}
