package com.ie303.uifive.repo;

import com.ie303.uifive.entity.GroupReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GroupReviewRepo extends JpaRepository<GroupReview, Long> {
}