package com.ie303.uifive.service.payment.gateway;

import com.ie303.uifive.dto.req.PaymentWebhookRequest;
import com.ie303.uifive.entity.PaymentProvider;
import com.ie303.uifive.entity.PaymentTransaction;

public interface PaymentGateway {

    PaymentProvider provider();

    String createPaymentUrl(PaymentTransaction transaction, String returnUrl);

    boolean verifySignature(PaymentWebhookRequest request);
}
