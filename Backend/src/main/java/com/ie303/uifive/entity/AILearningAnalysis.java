package com.ie303.uifive.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_learning_analysis")
@Data
public class AILearningAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "weak_skill", columnDefinition = "TEXT")
    private String weakSkill;

    @Column(name = "weak_topic", columnDefinition = "TEXT")
    private String weakTopic;

    @Column(columnDefinition = "TEXT")
    private String recommendation;

    @CreationTimestamp
    @Column(name = "generated_at")
    private LocalDateTime generatedAt;

    @ManyToOne
    private User user;
}
