package com.ie303.uifive.repo;

import com.ie303.uifive.entity.QuestionGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionGroupRepo extends JpaRepository<QuestionGroup, Long> {
    List<QuestionGroup> findByLessonId(Long lessonId);
    List<QuestionGroup> findByLessonIdOrderByIdAsc(Long lessonId);
}