package com.ie303.uifive.dto.req;

import com.ie303.uifive.entity.PaymentProvider;

public record PaymentCheckoutRequest(
        PaymentProvider provider,
        String returnUrl
) {
}
