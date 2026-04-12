package com.ie303.uifive.repo;

import com.ie303.uifive.entity.User;
import com.ie303.uifive.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepo extends JpaRepository<User, Long> {

    User findByUsername(String username);
    User findByEmail(String email);
    User findByVerificationToken(String token);
    List<User> findByRoleAndVerifiedTrueOrderByCoinDescScoreDescCreatedAtAsc(Role role);

}
