package com.ie303.uifive.repo;

import com.ie303.uifive.entity.AIWritingEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AIWritingEvalutionRepo extends JpaRepository<AIWritingEvaluation, Long> {
    void deleteByQuestionId(Long questionId);

    List<AIWritingEvaluation> findByUserId(Long userId);

    Optional<AIWritingEvaluation> findByUserIdAndQuestionId(Long userId, Long questionId);
}
