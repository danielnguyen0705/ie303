package com.ie303.uifive.repo;

import com.ie303.uifive.entity.Unit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UnitRepo extends JpaRepository<Unit, Long> {
    List<Unit> findByGradeIdOrderByUnitNumberAsc(Long gradeId);
}