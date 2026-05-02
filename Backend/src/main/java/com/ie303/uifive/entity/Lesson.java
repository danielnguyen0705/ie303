package com.ie303.uifive.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

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
    private boolean isReviewLesson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id")
    private Section section;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "is_vip_only")
    private boolean vipOnly;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    @OneToMany(mappedBy = "lesson", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Question> questions;

    @OneToMany(mappedBy = "lesson", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<QuestionGroup> questionGroups;
}
