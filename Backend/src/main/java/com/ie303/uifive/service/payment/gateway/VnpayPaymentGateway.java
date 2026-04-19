package com.ie303.uifive.service.payment.gateway;

import com.ie303.uifive.dto.req.PaymentWebhookRequest;
import com.ie303.uifive.entity.PaymentProvider;
import com.ie303.uifive.entity.PaymentTransaction;
import com.ie303.uifive.exception.AppException;
import com.ie303.uifive.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.StringJoiner;
import java.util.TreeMap;
import java.util.regex.Pattern;

@Component
public class VnpayPaymentGateway implements PaymentGateway {

    private static final ZoneId VNPAY_ZONE_ID = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter VNPAY_DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final Pattern ORDER_INFO_ALLOWED = Pattern.compile("[^A-Za-z0-9 _\\-\\.,]");

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
        if (tmnCode == null || tmnCode.isBlank() || vnpaySecret == null || vnpaySecret.isBlank()) {
            throw new AppException(ErrorCode.PAYMENT_PROVIDER_NOT_SUPPORTED, "VNPAY is not configured");
        }
        if (returnUrl == null || returnUrl.isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "returnUrl is required for VNPAY checkout");
        }

        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Amount", String.valueOf(transaction.getAmountMoney() * 100L));
        params.put("vnp_Command", "pay");
        LocalDateTime now = LocalDateTime.now(VNPAY_ZONE_ID);
        params.put("vnp_CreateDate", now.format(VNPAY_DATE_TIME_FORMATTER));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_IpAddr", "127.0.0.1");
        params.put("vnp_Locale", "vn");
        params.put("vnp_OrderInfo", buildOrderInfo(transaction));
        params.put("vnp_OrderType", "other");
        params.put("vnp_ReturnUrl", returnUrl);
        params.put("vnp_TmnCode", tmnCode);
        params.put("vnp_TxnRef", transaction.getTransactionCode());
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_ExpireDate", now.plusMinutes(15).format(VNPAY_DATE_TIME_FORMATTER));

        String hashData = toHashData(params);
        String query = toQueryData(params);
        String secureHash = GatewaySignUtils.hmacSha512Hex(hashData, vnpaySecret);

        return vnpayPayUrl + "?" + query
                + "&vnp_SecureHashType=HmacSHA512"
                + "&vnp_SecureHash=" + secureHash;
    }

    @Override
    public boolean verifySignature(PaymentWebhookRequest request) {
        if (vnpaySecret == null || vnpaySecret.isBlank()) {
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
        String expected = GatewaySignUtils.hmacSha256Hex(payload, vnpaySecret);
        return expected.equalsIgnoreCase(request.signature());
    }

    public boolean verifyIpnSignature(Map<String, String> params) {
        if (vnpaySecret == null || vnpaySecret.isBlank()) {
            return false;
        }

        if (params == null || params.isEmpty()) {
            return false;
        }

        String providedHash = params.get("vnp_SecureHash");
        if (providedHash == null || providedHash.isBlank()) {
            return false;
        }

        Map<String, String> signedParams = new TreeMap<>();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();

            if (key == null || !key.startsWith("vnp_")) {
                continue;
            }

            if ("vnp_SecureHash".equals(key) || "vnp_SecureHashType".equals(key)) {
                continue;
            }

            if (value == null || value.isBlank()) {
                continue;
            }

            signedParams.put(key, value);
        }

        if (signedParams.isEmpty()) {
            return false;
        }

        String hashData = toHashData(signedParams);
        String expected = GatewaySignUtils.hmacSha512Hex(hashData, vnpaySecret);
        return expected.equalsIgnoreCase(providedHash);
    }

    private String toHashData(Map<String, String> params) {
        StringJoiner joiner = new StringJoiner("&");
        params.forEach((key, value) -> joiner.add(key + "=" + encode(value)));
        return joiner.toString();
    }

    private String toQueryData(Map<String, String> params) {
        StringJoiner joiner = new StringJoiner("&");
        params.forEach((key, value) -> joiner.add(encode(key) + "=" + encode(value)));
        return joiner.toString();
    }

    private String buildOrderInfo(PaymentTransaction transaction) {
        String base = transaction.getDescription();
        if (base == null || base.isBlank()) {
            base = "Thanh toan " + transaction.getTransactionCode();
        }

        String withoutDiacritics = Normalizer.normalize(base, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        String sanitized = ORDER_INFO_ALLOWED.matcher(withoutDiacritics).replaceAll(" ")
                .replaceAll("\\s+", " ")
                .trim();
        if (sanitized.isBlank()) {
            sanitized = "Thanh toan " + transaction.getTransactionCode();
        }
        if (sanitized.length() > 255) {
            sanitized = sanitized.substring(0, 255);
        }
        return sanitized;
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.US_ASCII);
    }
}
