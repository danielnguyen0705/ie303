package com.ie303.uifive.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "shop_items")
@Data
public class ShopItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;

    @Column(name = "price_coin")
    private int priceCoin;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type")
    private ItemType itemType;
}
