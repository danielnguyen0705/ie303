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

    @Column(columnDefinition = "TEXT")

    private String description;
    private int price;
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    private ItemType type;

    private Integer durationDays;
    private boolean active = true;
}
