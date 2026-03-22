package com.ie303.uifive.repo;

import com.ie303.uifive.entity.UserUnitProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserUnitProgressRepo extends JpaRepository<UserUnitProgress, Long> {

    Optional<UserUnitProgress> findByUserIdAndUnitId(Long userId, Long unitId);
}