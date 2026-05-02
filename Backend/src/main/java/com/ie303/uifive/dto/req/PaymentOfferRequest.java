package com.ie303.uifive.dto.req;

import com.ie303.uifive.entity.PaymentOfferType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PaymentOfferRequest(
        @NotBlank(message = "name không được để trống")
        String name,

        String description,

        @NotNull(message = "type không được để trống")
        PaymentOfferType type,

        @Min(value = 0, message = "price phải >= 0")
        int price,

        Integer coinAmount,
        Integer durationDays,

        Boolean active
) {
}
