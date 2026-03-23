package com.ie303.uifive.dto.req;

import com.ie303.uifive.entity.ItemType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ShopItemRequest(
        @NotBlank(message = "name không được để trống")
        String name,

        String description,

        @NotNull(message = "priceCoin không được để trống")
        Integer priceCoin,

        @NotNull(message = "itemType không được để trống")
        ItemType itemType
) {
}