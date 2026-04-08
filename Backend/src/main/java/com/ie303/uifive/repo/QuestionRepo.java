package com.ie303.uifive.repo;

import com.ie303.uifive.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepo extends JpaRepository<Question, Long> {
    List<Question> findByLessonId(Long lessonId);
    List<Question> findByQuestionGroupId(Long questionGroupId);
}