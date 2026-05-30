package com.ie303.uifive.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Entity
@Table(name = "group_reviews")
@Data
public class GroupReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(name = "start_unit")
    private int startUnit;

    @Column(name = "end_unit")
    private int endUnit;

    @ManyToOne
    private Grade grade;

    @ManyToMany
    @JoinTable(
            name = "group_review_questions",
            joinColumns = @JoinColumn(name = "group_review_id"),
            inverseJoinColumns = @JoinColumn(name = "question_id")
    )
    private List<Question> questions;

    @ManyToMany
    @JoinTable(
            name = "group_review_question_groups",
            joinColumns = @JoinColumn(name = "group_review_id"),
            inverseJoinColumns = @JoinColumn(name = "question_group_id")
    )
    private List<QuestionGroup> questionGroups;
}
