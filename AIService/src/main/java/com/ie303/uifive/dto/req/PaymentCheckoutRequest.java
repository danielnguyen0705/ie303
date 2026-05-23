package com.ie303.uifive.dto.req;

import com.ie303.uifive.entity.PaymentProvider;
import jakarta.validation.constraints.NotNull;

public record PaymentCheckoutRequest(
        @NotNull(message = "provider không được để trống")
        PaymentProvider provider,
        String returnUrl
) {
}
