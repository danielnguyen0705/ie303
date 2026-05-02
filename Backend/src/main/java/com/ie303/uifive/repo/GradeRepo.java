package com.ie303.uifive.repo;

import com.ie303.uifive.entity.Grade;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GradeRepo extends JpaRepository<Grade, Long> {
}