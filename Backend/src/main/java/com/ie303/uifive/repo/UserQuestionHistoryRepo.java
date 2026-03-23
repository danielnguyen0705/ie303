package com.ie303.uifive.repo;

import com.ie303.uifive.entity.UserQuestionHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserQuestionHistoryRepo extends JpaRepository<UserQuestionHistory, Long> {

    Optional<UserQuestionHistory> findByUserIdAndQuestionId(Long userId, Long questionId);

    List<UserQuestionHistory> findByUserId(Long userId);

    List<UserQuestionHistory> findByQuestionId(Long questionId);
}