package com.ie303.uifive.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_speaking_evaluations")
@Data
public class AISpeakingEvaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "audio_url", columnDefinition = "TEXT")
    private String audioUrl;

    @Column(name = "transcript_text", columnDefinition = "TEXT")
    private String transcriptText;

    @Column(name = "ai_score")
    private double aiScore;

    @Column(name = "ai_feedback", columnDefinition = "TEXT")
    private String aiFeedback;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "question_id")
    private Long questionId;
}
