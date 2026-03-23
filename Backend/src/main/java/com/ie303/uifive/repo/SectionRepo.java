package com.ie303.uifive.repo;

import com.ie303.uifive.entity.Section;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SectionRepo extends JpaRepository<Section, Long> {
}