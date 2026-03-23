package com.ie303.uifive.repo;

import com.ie303.uifive.entity.UnitReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UnitReviewRepo extends JpaRepository<UnitReview, Long> {
}