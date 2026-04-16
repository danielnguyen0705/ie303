package com.ie303.uifive.service.payment.gateway;

import com.ie303.uifive.dto.req.PaymentWebhookRequest;
import com.ie303.uifive.entity.PaymentProvider;
import com.ie303.uifive.entity.PaymentTransaction;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class BankPaymentGateway implements PaymentGateway {

    @Value("${payment.bank.qr-base-url:https://img.vietqr.io/image}")
    private String bankQrBaseUrl;

    @Value("${payment.bank.bank-bin:970415}")
    private String bankBin;

    @Value("${payment.bank.account-number:0000000000}")
    private String accountNumber;

    @Value("${payment.bank.secret:}")
    private String bankSecret;

    @Override
    public PaymentProvider provider() {
        return PaymentProvider.BANK;
    }

    @Override
    public String createPaymentUrl(PaymentTransaction transaction, String returnUrl) {
        String accountPath = bankBin + "-" + accountNumber;
        String content = "PAY " + transaction.getTransactionCode();

        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(bankQrBaseUrl + "/" + accountPath + "-compact2.png")
                .queryParam("amount", transaction.getAmountMoney())
                .queryParam("addInfo", content)
                .queryParam("accountName", "UIFive");

        if (returnUrl != null && !returnUrl.isBlank()) {
            builder.queryParam("returnUrl", returnUrl);
        }

        return builder.toUriString();
    }

    @Override
    public boolean verifySignature(PaymentWebhookRequest request) {
        if (bankSecret == null || bankSecret.isBlank()) {
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
        String expected = GatewaySignUtils.hmacSha256Hex(payload, bankSecret);
        return expected.equalsIgnoreCase(request.signature());
    }
}
