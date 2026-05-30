package com.ie303.uifive.repo;

import com.ie303.uifive.entity.Role;
import com.ie303.uifive.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserRepo extends JpaRepository<User, Long> {
    User findByUsername(String username);
    User findByEmail(String email);

    List<User> findByRoleAndVerifiedTrueOrderByCoinDescScoreDescStreakDescCreatedAtAsc(Role role);

    List<User> findByRoleAndVerifiedTrueOrderByExpDescStreakDescCoinDescCreatedAtAsc(Role role);
}
