package com.ie303.uifive.dto.req;

import com.ie303.uifive.entity.PaymentProvider;
import com.ie303.uifive.entity.PaymentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PaymentWebhookRequest(
        @NotBlank(message = "transactionCode không được để trống")
        String transactionCode,

        @NotNull(message = "provider không được để trống")
        PaymentProvider provider,

        @NotNull(message = "status không được để trống")
        PaymentStatus status,

        String providerTransactionId,
        String signature
) {
}
