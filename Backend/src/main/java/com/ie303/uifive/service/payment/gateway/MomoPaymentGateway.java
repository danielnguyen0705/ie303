package com.ie303.uifive.service.payment.gateway;

import com.ie303.uifive.dto.req.PaymentWebhookRequest;
import com.ie303.uifive.entity.PaymentProvider;
import com.ie303.uifive.entity.PaymentTransaction;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class MomoPaymentGateway implements PaymentGateway {

    @Value("${payment.momo.pay-url:https://test-payment.momo.vn/mock}")
    private String momoPayUrl;

    @Value("${payment.momo.secret:}")
    private String momoSecret;

    @Value("${payment.momo.enabled:true}")
    private boolean momoEnabled;

    @Override
    public PaymentProvider provider() {
        return PaymentProvider.MOMO;
    }

    @Override
    public String createPaymentUrl(PaymentTransaction transaction, String returnUrl) {
        if (!momoEnabled) {
            throw new AppException(ErrorCode.PAYMENT_PROVIDER_NOT_SUPPORTED, "MOMO is temporarily disabled");
        }

        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(momoPayUrl)
                .queryParam("transactionCode", transaction.getTransactionCode())
                .queryParam("amount", transaction.getAmountMoney())
                .queryParam("description", transaction.getDescription());

        if (returnUrl != null && !returnUrl.isBlank()) {
            builder.queryParam("returnUrl", returnUrl);
        }

        return builder.toUriString();
    }

    @Override
    public boolean verifySignature(PaymentWebhookRequest request) {
        if (momoSecret == null || momoSecret.isBlank()) {
            return false;
        }
        if (request.signature() == null || request.signature().isBlank()) {
            return false;
        }

        String payload = GatewaySignUtils.canonicalWebhookPayload(
                request.transactionCode(),
                request.status().name(),
                request.providerTransactionId(),
                request.amountMoney()
        );
        String expected = GatewaySignUtils.hmacSha256Hex(payload, momoSecret);
        return expected.equalsIgnoreCase(request.signature());
    }
}
