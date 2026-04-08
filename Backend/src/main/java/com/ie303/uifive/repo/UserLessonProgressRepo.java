package com.ie303.uifive.repo;

import com.ie303.uifive.entity.Grade;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.entity.UserLessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserLessonProgressRepo extends JpaRepository<UserLessonProgress, Long> {
    Optional<UserLessonProgress> findByUserIdAndLessonId(Long userId, Long lessonId);

    @Query("""
        select distinct ulp.lesson.section.unit.grade
        from UserLessonProgress ulp
        where ulp.user = :user
    """)
    List<Grade> findDistinctGradesByUser(User user);

    @Query("""
        select count(l)
        from Lesson l
        where l.section.unit.grade.id = :gradeId
    """)
    int countTotalLessonsByGradeId(Long gradeId);

    @Query("""
        select count(distinct ulp.lesson.id)
        from UserLessonProgress ulp
        where ulp.user = :user
          and ulp.completed = true
          and ulp.lesson.section.unit.grade.id = :gradeId
    """)
    int countCompletedLessonsByUserAndGrade(User user, Long gradeId);

    @Query("""
        select count(distinct ulp.lesson.id)
        from UserLessonProgress ulp
        where ulp.user = :user
          and ulp.completed = true
          and ulp.lesson.section.unit.id = :unitId
    """)
    int countCompletedLessonsByUserAndUnit(User user, Long unitId);

    @Query("""
        select count(distinct ulp.lesson.id)
        from UserLessonProgress ulp
        where ulp.user = :user
          and ulp.completed = true
          and ulp.lesson.section.id = :sectionId
    """)
    int countCompletedLessonsByUserAndSection(User user, Long sectionId);

    @Query("""
        select distinct ulp.lesson.id
        from UserLessonProgress ulp
        where ulp.user = :user
          and ulp.completed = true
          and ulp.lesson.section.unit.grade.id = :gradeId
    """)
    java.util.Set<Long> findCompletedLessonIdsByUserAndGrade(User user, Long gradeId);
}