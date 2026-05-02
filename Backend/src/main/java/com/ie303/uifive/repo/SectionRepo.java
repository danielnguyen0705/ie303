package com.ie303.uifive.repo;

import com.ie303.uifive.entity.Section;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SectionRepo extends JpaRepository<Section, Long> {
    List<Section> findByUnitIdOrderBySectionNumberAsc(Long unitId);
}