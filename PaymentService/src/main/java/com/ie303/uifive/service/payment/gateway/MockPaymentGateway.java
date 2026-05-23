package com.ie303.uifive.service.payment.gateway;

import com.ie303.uifive.dto.req.PaymentWebhookRequest;
import com.ie303.uifive.entity.PaymentProvider;
import com.ie303.uifive.entity.PaymentTransaction;
import org.springframework.stereotype.Component;

@Component
public class MockPaymentGateway implements PaymentGateway {

    @Override
    public PaymentProvider provider() {
        return PaymentProvider.MOCK;
    }

    @Override
    public String createPaymentUrl(PaymentTransaction transaction, String returnUrl) {
        return "/api/payments/mock-confirm/" + transaction.getTransactionCode();
    }

    @Override
    public boolean verifySignature(PaymentWebhookRequest request) {
        return true;
    }
}
