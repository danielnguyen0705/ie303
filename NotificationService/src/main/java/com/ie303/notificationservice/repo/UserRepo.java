package com.ie303.notificationservice.repo;

import com.ie303.notificationservice.entity.Role;
import com.ie303.notificationservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepo extends JpaRepository<User, Long> {

    List<User> findByRole(Role role);

    List<User> findByRoleAndEmailIsNotNull(Role role);

    Optional<User> findByUsername(String username);
}
