package com.ie303.uifive.repo;

import com.ie303.uifive.entity.ShopItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ShopItemRepo extends JpaRepository<ShopItem, Long> {
}