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
import lombok.Data;

@Entity
@Table(name = "lessons")
@Data
public class Lesson {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "lesson_number")
    private int lessonNumber;
    private String title;

    @Column(name = "skill_type")
    @Enumerated(EnumType.STRING)
    private SkillType skillType;

    @Column(name = "is_review_lesson")
    private boolean reviewLesson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id")
    private Section section;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "is_vip_only")
    private boolean vipOnly;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;
}
