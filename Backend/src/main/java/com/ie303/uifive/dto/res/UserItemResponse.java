package com.ie303.uifive.dto.res;

import java.time.LocalDateTime;

public record UserItemResponse(
        Long id,
        int quantity,
        LocalDateTime purchasedAt,
        Long userId,
        Long itemId
) {}