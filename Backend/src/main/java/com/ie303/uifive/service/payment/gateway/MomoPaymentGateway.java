package com.ie303.uifive.service.payment.gateway;

import com.ie303.uifive.dto.req.PaymentWebhookRequest;
import com.ie303.uifive.entity.PaymentProvider;
import com.ie303.uifive.entity.PaymentTransaction;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class MomoPaymentGateway implements PaymentGateway {

    @Value("${payment.momo.pay-url:https://test-payment.momo.vn/mock}")
    private String momoPayUrl;

    @Value("${payment.momo.secret:}")
    private String momoSecret;

    @Override
    public PaymentProvider provider() {
        return PaymentProvider.MOMO;
    }

    @Override
    public String createPaymentUrl(PaymentTransaction transaction, String returnUrl) {
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
            return true;
        }
        if (request.signature() == null || request.signature().isBlank()) {
            return false;
        }

        String payload = GatewaySignUtils.canonicalWebhookPayload(
                request.transactionCode(),
                request.status().name(),
                request.providerTransactionId()
        );
        String expected = GatewaySignUtils.hmacSha256Hex(payload, momoSecret);
        return expected.equalsIgnoreCase(request.signature());
    }
}
