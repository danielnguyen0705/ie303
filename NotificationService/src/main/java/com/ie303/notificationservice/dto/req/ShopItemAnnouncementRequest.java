package com.ie303.notificationservice.dto.req;

public record ShopItemAnnouncementRequest(
        Long itemId,
        String name,
        String description,
        Integer price,
        String type,
        Integer durationDays,
        Double expMultiplier,
        Boolean active
) {
}
