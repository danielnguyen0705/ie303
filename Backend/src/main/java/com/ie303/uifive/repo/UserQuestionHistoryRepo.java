package com.ie303.uifive.repo;

import com.ie303.uifive.entity.UserQuestionHistory;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserQuestionHistoryRepo extends JpaRepository<UserQuestionHistory, Long> {

    Optional<UserQuestionHistory> findByUserIdAndQuestionId(Long userId, Long questionId);

    List<UserQuestionHistory> findByUserId(Long userId);

    List<UserQuestionHistory> findByQuestionId(Long questionId);

    @Modifying
    @Transactional
    void deleteByQuestionIdIn(List<Long> questionIds);

    @Query("""
        select count(distinct q.id)
        from Question q
        where (q.lesson is not null and q.lesson.id = :lessonId)
           or (q.questionGroup is not null and q.questionGroup.lesson is not null and q.questionGroup.lesson.id = :lessonId)
    """)
    long countQuestionsByLessonId(Long lessonId);

    @Query("""
        select count(distinct h.question.id)
        from UserQuestionHistory h
        where h.user.id = :userId
          and (
                (h.question.lesson is not null and h.question.lesson.id = :lessonId)
             or (h.question.questionGroup is not null and h.question.questionGroup.lesson is not null and h.question.questionGroup.lesson.id = :lessonId)
          )
    """)
    long countAnsweredQuestionsByUserAndLesson(Long userId, Long lessonId);

    @Query("""
        select count(distinct h.question.id)
        from UserQuestionHistory h
        where h.user.id = :userId
          and h.correct = true
          and (
                (h.question.lesson is not null and h.question.lesson.id = :lessonId)
             or (h.question.questionGroup is not null and h.question.questionGroup.lesson is not null and h.question.questionGroup.lesson.id = :lessonId)
          )
    """)
    long countCorrectQuestionsByUserAndLesson(Long userId, Long lessonId);
}