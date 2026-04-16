package com.ie303.uifive.dto.res;

import com.ie303.uifive.entity.PaymentOfferType;

import java.time.LocalDateTime;

public record PaymentOfferResponse(
        Long id,
        String name,
        String description,
        PaymentOfferType type,
        int price,
        Integer coinAmount,
        Integer durationDays,
        boolean active,
        LocalDateTime createdAt
) {
}
