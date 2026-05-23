package com.ie303.uifive.repo;

import com.ie303.uifive.entity.Unit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UnitRepo extends JpaRepository<Unit, Long> {
    List<Unit> findByGradeIdOrderByUnitNumberAsc(Long gradeId);
}
