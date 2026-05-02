package com.ie303.uifive.dto.res;

import com.ie303.uifive.entity.PaymentOfferType;
import com.ie303.uifive.entity.PaymentProvider;
import com.ie303.uifive.entity.PaymentStatus;

import java.time.LocalDateTime;

public record PaymentTransactionResponse(
        Long id,
        String transactionCode,
        PaymentOfferType type,
        PaymentProvider provider,
        PaymentStatus status,
        int amountMoney,
        int amountCoin,
        Integer durationDays,
        Integer balanceBefore,
        Integer balanceAfter,
        LocalDateTime vipExpiredBefore,
        LocalDateTime vipExpiredAfter,
        String description,
        String providerTransactionId,
        LocalDateTime createdAt,
        LocalDateTime paidAt,
        Long offerId,
        String offerName
) {
}
