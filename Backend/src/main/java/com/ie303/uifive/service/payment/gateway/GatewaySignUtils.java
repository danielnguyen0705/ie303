package com.ie303.uifive.service.payment.gateway;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

public final class GatewaySignUtils {

    private GatewaySignUtils() {
    }

    public static String hmacSha256Hex(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(digest);
        } catch (Exception exception) {
            throw new IllegalStateException("Could not calculate HMAC signature", exception);
        }
    }

    public static String canonicalWebhookPayload(String transactionCode, String status, String providerTransactionId) {
        return transactionCode + "|" + status + "|" + (providerTransactionId == null ? "" : providerTransactionId);
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder builder = new StringBuilder(bytes.length * 2);
        for (byte value : bytes) {
            int b = value & 0xFF;
            if (b < 16) {
                builder.append('0');
            }
            builder.append(Integer.toHexString(b));
        }
        return builder.toString();
    }
}
