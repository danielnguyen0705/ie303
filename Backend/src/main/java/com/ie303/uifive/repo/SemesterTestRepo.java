package com.ie303.uifive.repo;

import com.ie303.uifive.entity.SemesterTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SemesterTestRepo extends JpaRepository<SemesterTest, Long> {
}