package com.ie303.uifive.repo;

import com.ie303.uifive.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface LessonRepo extends JpaRepository<Lesson, Long> {
    @Query("""
        select l
        from Lesson l
        where l.section.id = :sectionId
        order by coalesce(l.orderIndex, l.lessonNumber) asc,
                 l.lessonNumber asc,
                 l.id asc
    """)
    List<Lesson> findBySectionIdOrdered(Long sectionId);

    @Query("""
        select l
        from Lesson l
        where l.section.unit.grade.id = :gradeId
        order by l.section.unit.unitNumber asc,
                 l.section.sectionNumber asc,
                 coalesce(l.orderIndex, l.lessonNumber) asc,
                 l.lessonNumber asc,
                 l.id asc
    """)
    List<Lesson> findAllByGradeIdOrder(Long gradeId);

    @Query("""
        select count(l)
        from Lesson l
        where l.section.unit.id = :unitId
    """)
    int countLessonsByUnitId(Long unitId);

    @Query("""
        select count(l)
        from Lesson l
        where l.section.id = :sectionId
    """)
    int countLessonsBySectionId(Long sectionId);
}
