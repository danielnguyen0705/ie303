package com.ie303.uifive.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_items")
@Data
public class UserItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int quantity;

    @Column(name = "purchased_at")
    @CreationTimestamp
    private LocalDateTime purchasedAt;

    @ManyToOne
    private User user;

    @ManyToOne
    private ShopItem item;
}
