package com.ie303.uifive.dto.req;

import com.ie303.uifive.entity.ItemType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.multipart.MultipartFile;

public record ShopItemRequest(
        @NotBlank(message = "name không được để trống")
        String name,

        String description,

        @Min(value = 0, message = "price phải >= 0")
        int price,

        String imageUrl,
        MultipartFile imageFile,

        @NotNull(message = "type không được để trống")
        ItemType type,

        Integer durationDays,
        Double expMultiplier,

        Boolean active
) {
}
