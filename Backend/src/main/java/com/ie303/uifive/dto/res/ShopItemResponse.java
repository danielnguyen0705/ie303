package com.ie303.uifive.dto.res;

import com.ie303.uifive.entity.ItemType;

public record ShopItemResponse(
        Long id,
        String name,
        String description,
        int priceCoin,
        ItemType itemType
) {
}