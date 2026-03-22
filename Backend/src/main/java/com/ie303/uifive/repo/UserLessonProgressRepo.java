package com.ie303.uifive.repo;

import com.ie303.uifive.entity.UserLessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserLessonProgressRepo extends JpaRepository<UserLessonProgress, Long> {

    Optional<UserLessonProgress> findByUserIdAndLessonId(Long userId, Long lessonId);
}