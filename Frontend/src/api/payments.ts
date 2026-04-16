import type {
  ApiResponse,
  PaymentCheckoutRequest,
  PaymentCheckoutResponse,
  PaymentOffer,
  PaymentProvider,
  PaymentTransaction,
  PaymentWebhookRequest,
} from "./types";
import { createError, request } from "./utils/http";

const SUPPORTED_PAYMENT_PROVIDERS: PaymentProvider[] = [
  "MOCK",
  "MOMO",
  "VNPAY",
  "BANK",
];

export async function getActivePaymentOffers(): Promise<
  ApiResponse<PaymentOffer[]>
> {
  return request<PaymentOffer[]>("/payments/offers/active", {
    method: "GET",
  });
}

export async function createCheckoutTransaction(
  offerId: number,
  payload: PaymentCheckoutRequest,
): Promise<ApiResponse<PaymentCheckoutResponse>> {
  if (!offerId || offerId <= 0) {
    return createError("Invalid offer id", "VALIDATION_ERROR");
  }

  if (!SUPPORTED_PAYMENT_PROVIDERS.includes(payload.provider)) {
    return createError("Unsupported payment provider", "VALIDATION_ERROR");
  }

  if (!payload.returnUrl?.trim()) {
    return createError("returnUrl is required", "VALIDATION_ERROR");
  }

  return request<PaymentCheckoutResponse>(`/payments/checkout/${offerId}`, {
    method: "POST",
    body: JSON.stringify({
      provider: payload.provider,
      returnUrl: payload.returnUrl.trim(),
    }),
  });
}

export async function paymentWebhook(
  payload: PaymentWebhookRequest,
): Promise<ApiResponse<PaymentTransaction>> {
  if (!payload.transactionCode?.trim()) {
    return createError("transactionCode is required", "VALIDATION_ERROR");
  }

  if (!SUPPORTED_PAYMENT_PROVIDERS.includes(payload.provider)) {
    return createError("Unsupported payment provider", "VALIDATION_ERROR");
  }

  if (!payload.status) {
    return createError("status is required", "VALIDATION_ERROR");
  }

  return request<PaymentTransaction>("/payments/webhook", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function mockConfirmPayment(
  transactionCode: string,
): Promise<ApiResponse<PaymentTransaction>> {
  if (!transactionCode?.trim()) {
    return createError("transactionCode is required", "VALIDATION_ERROR");
  }

  return request<PaymentTransaction>(
    `/payments/mock-confirm/${encodeURIComponent(transactionCode.trim())}`,
    {
      method: "POST",
    },
  );
}

export async function getMyTransactions(): Promise<
  ApiResponse<PaymentTransaction[]>
> {
  return request<PaymentTransaction[]>("/payments/my-transactions", {
    method: "GET",
  });
}

export async function getMyTransactionDetail(
  transactionId: number,
): Promise<ApiResponse<PaymentTransaction>> {
  if (!transactionId || transactionId <= 0) {
    return createError("Invalid transaction id", "VALIDATION_ERROR");
  }

  return request<PaymentTransaction>(
    `/payments/my-transactions/${transactionId}`,
    {
      method: "GET",
    },
  );
}

export async function cancelMyTransaction(
  transactionId: number,
): Promise<ApiResponse<PaymentTransaction>> {
  if (!transactionId || transactionId <= 0) {
    return createError("Invalid transaction id", "VALIDATION_ERROR");
  }

  return request<PaymentTransaction>(
    `/payments/my-transactions/${transactionId}/cancel`,
    {
      method: "POST",
    },
  );
}

export { SUPPORTED_PAYMENT_PROVIDERS };
