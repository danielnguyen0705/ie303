package com.ie303.uifive.dto.res;

import com.ie303.uifive.entity.PaymentOfferType;
import com.ie303.uifive.entity.PaymentProvider;
import com.ie303.uifive.entity.PaymentStatus;

public record PaymentCheckoutResponse(
        Long transactionId,
        String transactionCode,
        PaymentOfferType type,
        PaymentProvider provider,
        int amountMoney,
        int amountCoin,
        Integer durationDays,
        PaymentStatus status,
        String paymentUrl,
        String message
) {
}
