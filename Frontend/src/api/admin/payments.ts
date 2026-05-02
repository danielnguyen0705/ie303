import type {
  ApiResponse,
  PaymentOffer,
  PaymentOfferType,
  PaymentOfferUpsertRequest,
  PaymentTransaction,
} from "../types";
import { createError, request } from "../utils/http";

function validateOfferPayload(
  payload: PaymentOfferUpsertRequest,
): ApiResponse<never> | null {
  if (!payload.name?.trim()) {
    return createError("Offer name is required", "VALIDATION_ERROR");
  }

  if (!payload.type) {
    return createError("Offer type is required", "VALIDATION_ERROR");
  }

  if (payload.price < 0) {
    return createError(
      "Price must be greater than or equal to 0",
      "VALIDATION_ERROR",
    );
  }

  if (payload.type === "VIP") {
    if (!payload.durationDays || payload.durationDays <= 0) {
      return createError(
        "VIP offer requires durationDays > 0",
        "VALIDATION_ERROR",
      );
    }
  }

  if (payload.type === "COIN") {
    if (!payload.coinAmount || payload.coinAmount <= 0) {
      return createError(
        "COIN offer requires coinAmount > 0",
        "VALIDATION_ERROR",
      );
    }
  }

  return null;
}

function normalizeOfferPayload(payload: PaymentOfferUpsertRequest) {
  return {
    name: payload.name.trim(),
    description: payload.description?.trim() || undefined,
    type: payload.type,
    price: payload.price,
    coinAmount: payload.type === "COIN" ? (payload.coinAmount ?? null) : null,
    durationDays:
      payload.type === "VIP" ? (payload.durationDays ?? null) : null,
    active: payload.active ?? true,
  };
}

export async function createPaymentOffer(
  payload: PaymentOfferUpsertRequest,
): Promise<ApiResponse<PaymentOffer>> {
  const validationError = validateOfferPayload(payload);
  if (validationError) {
    return validationError;
  }

  return request<PaymentOffer>("/payments/offers", {
    method: "POST",
    body: JSON.stringify(normalizeOfferPayload(payload)),
  });
}

export async function updatePaymentOffer(
  id: number,
  payload: PaymentOfferUpsertRequest,
): Promise<ApiResponse<PaymentOffer>> {
  if (!id || id <= 0) {
    return createError("Invalid offer id", "VALIDATION_ERROR");
  }

  const validationError = validateOfferPayload(payload);
  if (validationError) {
    return validationError;
  }

  return request<PaymentOffer>(`/payments/offers/${id}`, {
    method: "PUT",
    body: JSON.stringify(normalizeOfferPayload(payload)),
  });
}

export async function getPaymentOffer(
  id: number,
): Promise<ApiResponse<PaymentOffer>> {
  if (!id || id <= 0) {
    return createError("Invalid offer id", "VALIDATION_ERROR");
  }

  return request<PaymentOffer>(`/payments/offers/${id}`, {
    method: "GET",
  });
}

export async function getAllPaymentOffers(): Promise<
  ApiResponse<PaymentOffer[]>
> {
  return request<PaymentOffer[]>("/payments/offers", {
    method: "GET",
  });
}

export async function softDeletePaymentOffer(
  id: number,
): Promise<ApiResponse<boolean>> {
  if (!id || id <= 0) {
    return createError("Invalid offer id", "VALIDATION_ERROR");
  }

  return request<boolean>(`/payments/offers/${id}`, {
    method: "DELETE",
  });
}

export async function getAllPaymentTransactions(): Promise<
  ApiResponse<PaymentTransaction[]>
> {
  return request<PaymentTransaction[]>("/payments/transactions", {
    method: "GET",
  });
}

export const PAYMENT_OFFER_TYPES: PaymentOfferType[] = ["VIP", "COIN"];
