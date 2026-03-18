package com.ie303.uifive.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "user_section_progress")
@Data
public class UserSectionProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private boolean completed;

    @Column(name = "progress_percent")
    private double progressPercent;

    @ManyToOne
    private User user;

    @ManyToOne
    private Section section;
}