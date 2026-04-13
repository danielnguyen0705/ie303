package com.ie303.uifive.dto.res;

import com.ie303.uifive.entity.ItemType;

import java.time.LocalDateTime;

public record UserItemResponse(
        Long userItemId,
        Long shopItemId,
        String name,
        String imageUrl,
        ItemType type,
        int quantity,
        boolean equipped,
        LocalDateTime purchasedAt
) {}