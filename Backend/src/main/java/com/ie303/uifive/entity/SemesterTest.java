package com.ie303.uifive.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Entity
@Table(name = "semester_tests")
@Data
public class SemesterTest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(name = "start_unit")
    private int startUnit;

    @Column(name = "end_unit")
    private int endUnit;

    @Column(name = "time_limit")
    private int timeLimit;

    @ManyToOne
    private Grade grade;

    @ManyToMany
    private List<Question> questions;
}
