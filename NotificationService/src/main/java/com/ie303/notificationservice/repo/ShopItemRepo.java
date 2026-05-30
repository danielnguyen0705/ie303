package com.ie303.notificationservice.repo;

import com.ie303.notificationservice.entity.ShopItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShopItemRepo extends JpaRepository<ShopItem, Long> {
}
