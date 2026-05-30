package com.ie303.uifive.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Entity
@Table(name = "question_groups")
@Data
public class QuestionGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "group_type")
    private QuestionGroupType groupType;

    @Column(columnDefinition = "TEXT")
    private String title;

    @Column(name = "instruction", columnDefinition = "TEXT")
    private String instruction;

    @Column(name = "shared_content", columnDefinition = "TEXT")
    private String sharedContent;

    @Column(name = "audio_url", columnDefinition = "TEXT")
    private String audioUrl;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "group_data", columnDefinition = "TEXT")
    private String groupData;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id")
    private Lesson lesson;

    @OneToMany(mappedBy = "questionGroup", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<Question> questions;
}