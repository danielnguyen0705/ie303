package com.ie303.uifive.repo;

import com.ie303.uifive.entity.ItemType;
import com.ie303.uifive.entity.ShopItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ShopItemRepo extends JpaRepository<ShopItem, Long> {
    List<ShopItem> findByActiveTrue();

    long countByTypeIn(Collection<ItemType> types);
}
