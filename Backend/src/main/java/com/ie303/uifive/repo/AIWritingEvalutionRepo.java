package com.ie303.uifive.repo;

import com.ie303.uifive.entity.AIWritingEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AIWritingEvalutionRepo extends JpaRepository<AIWritingEvaluation, Long> {
}
