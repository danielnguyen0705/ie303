package com.ie303.uifive.repo;

import com.ie303.uifive.entity.ItemType;
import com.ie303.uifive.entity.ShopItem;
import com.ie303.uifive.entity.User;
import com.ie303.uifive.entity.UserItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserItemRepo extends JpaRepository<UserItem, Long> {
    Optional<UserItem> findByUserAndItem(User user, ShopItem item);

    List<UserItem> findByUser(User user);
    List<UserItem> findByUserIn(List<User> users);

    List<UserItem> findByUserAndItem_Type(User user, ItemType type);

    Optional<UserItem> findByIdAndUser(Long id, User user);

    @Query("""
        select ui.user.id, ui.item.type, count(distinct ui.item.id)
        from UserItem ui
        where ui.user.id in :userIds
          and ui.quantity > 0
          and ui.item.type in :types
        group by ui.user.id, ui.item.type
    """)
    List<Object[]> countCollectorItemsByUserIds(@Param("userIds") List<Long> userIds, @Param("types") List<ItemType> types);
}
