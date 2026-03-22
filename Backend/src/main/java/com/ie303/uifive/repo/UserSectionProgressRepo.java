package com.ie303.uifive.repo;

import com.ie303.uifive.entity.UserSectionProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserSectionProgressRepo extends JpaRepository<UserSectionProgress, Long> {

    Optional<UserSectionProgress> findByUserIdAndSectionId(Long userId, Long sectionId);
}