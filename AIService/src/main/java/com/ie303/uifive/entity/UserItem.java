package com.ie303.uifive.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "user_items",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"user_id", "item_id"})
        }
)
@Data
public class UserItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int quantity;
    private boolean equipped;

    @Column(name = "purchased_at")
    @CreationTimestamp
    private LocalDateTime purchasedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id")
    private ShopItem item;
}