package com.ie303.uifive.repo;

import com.ie303.uifive.entity.UnitReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UnitReviewRepo extends JpaRepository<UnitReview, Long> {
    Optional<UnitReview> findByUnitId(Long unitId);
}