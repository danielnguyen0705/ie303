package com.ie303.uifive.repo;

import com.ie303.uifive.entity.UserItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserItemRepo extends JpaRepository<UserItem, Long> {
}