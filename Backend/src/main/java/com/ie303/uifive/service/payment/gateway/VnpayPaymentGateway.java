package com.ie303.uifive.service.payment.gateway;

import com.ie303.uifive.dto.req.PaymentWebhookRequest;
import com.ie303.uifive.entity.PaymentProvider;
import com.ie303.uifive.entity.PaymentTransaction;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class VnpayPaymentGateway implements PaymentGateway {

    @Value("${payment.vnpay.pay-url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}")
    private String vnpayPayUrl;

    @Value("${payment.vnpay.secret:}")
    private String vnpaySecret;

    @Value("${payment.vnpay.tmn-code:}")
    private String tmnCode;

    @Override
    public PaymentProvider provider() {
        return PaymentProvider.VNPAY;
    }

    @Override
    public String createPaymentUrl(PaymentTransaction transaction, String returnUrl) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(vnpayPayUrl)
                .queryParam("vnp_TmnCode", tmnCode)
                .queryParam("vnp_TxnRef", transaction.getTransactionCode())
                .queryParam("vnp_Amount", transaction.getAmountMoney() * 100L)
                .queryParam("vnp_OrderInfo", transaction.getDescription() == null ? "UIFive payment" : transaction.getDescription());

        if (returnUrl != null && !returnUrl.isBlank()) {
            builder.queryParam("vnp_ReturnUrl", returnUrl);
        }

        return builder.toUriString();
    }

    @Override
    public boolean verifySignature(PaymentWebhookRequest request) {
        if (vnpaySecret == null || vnpaySecret.isBlank()) {
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
        String expected = GatewaySignUtils.hmacSha256Hex(payload, vnpaySecret);
        return expected.equalsIgnoreCase(request.signature());
    }
}
