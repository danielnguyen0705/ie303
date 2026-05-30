package com.ie303.uifive.repo;

import com.ie303.uifive.entity.Section;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SectionRepo extends JpaRepository<Section, Long> {
    List<Section> findByUnitIdOrderBySectionNumberAsc(Long unitId);
}
