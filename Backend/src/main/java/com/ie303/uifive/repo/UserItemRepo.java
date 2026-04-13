package com.ie303.uifive.repo;

import com.ie303.uifive.entity.ItemType;
import com.ie303.uifive.entity.ShopItem;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.entity.UserItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserItemRepo extends JpaRepository<UserItem, Long> {
    Optional<UserItem> findByUserAndItem(User user, ShopItem item);

    List<UserItem> findByUser(User user);
    List<UserItem> findByUserIn(List<User> users);

    List<UserItem> findByUserAndItem_Type(User user, ItemType type);

    Optional<UserItem> findByIdAndUser(Long id, User user);
}
