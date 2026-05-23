package com.ie303.uifive.repo;

import com.ie303.uifive.entity.ShopItem;
import com.ie303.uifive.entity.ItemType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ShopItemRepo extends JpaRepository<ShopItem, Long> {
    List<ShopItem> findByActiveTrue();
    long countByTypeIn(Collection<ItemType> types);
}
