package com.ie303.uifive.repo;

import com.ie303.uifive.entity.AILearningAnalysis;
import com.ie303.uifive.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AILearningAnalysisRepo extends JpaRepository<AILearningAnalysis, Long> {
    List<AILearningAnalysis> findByUserOrderByGeneratedAtDesc(User user);

    Optional<AILearningAnalysis> findTopByUserOrderByGeneratedAtDesc(User user);
}
