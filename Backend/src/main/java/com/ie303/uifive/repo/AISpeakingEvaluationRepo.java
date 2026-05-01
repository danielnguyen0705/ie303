package com.ie303.uifive.repo;

import com.ie303.uifive.entity.AISpeakingEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AISpeakingEvaluationRepo extends JpaRepository<AISpeakingEvaluation, Long> {
    void deleteByQuestionId(Long questionId);
}
