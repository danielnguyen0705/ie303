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
    private List<Question> questions;
}
