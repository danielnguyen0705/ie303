package com.ie303.uifive.dto.req;

public record PaymentCompletedRequest(
        String email,
        String username,
        String transactionCode,
        String type,
        String provider,
        Integer amountMoney,
        Integer amountCoin,
        Integer durationDays,
        String status,
        String providerTransactionId
) {
}
