import { ENV } from "@/config/env";
import { ApiError, type ApiResponse } from "../types";

const BASE_URL = ENV.API_BASE_URL;

export function createError(
  message: string,
  code: string = "ERROR",
): ApiResponse<never> {
  return {
    success: false,
    error: new ApiError(code, message),
  };
}

export async function request<T>(
  url: string,
  options: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    const isFormDataBody =
      typeof FormData !== "undefined" && options.body instanceof FormData;

    const res = await fetch(`${BASE_URL}${url}`, {
      ...options,
      credentials: "include",
      headers: {
        ...(isFormDataBody ? {} : { "Content-Type": "application/json" }),
        ...(options.headers || {}),
      },
    });

    const rawText = await res.text();
    let data: unknown = null;

    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      data = rawText;
    }

    if (!res.ok) {
      const errorPayload = data as
        | { code?: string; message?: string }
        | string
        | null;
      return {
        success: false,
        error: new ApiError(
          typeof errorPayload === "string"
            ? "API_ERROR"
            : errorPayload?.code || "API_ERROR",
          typeof errorPayload === "string"
            ? errorPayload || `Error ${res.status}`
            : errorPayload?.message || `Error ${res.status}`,
        ),
      };
    }

    const payload = data as {
      code?: number;
      message?: string | null;
      result?: T;
      data?: T;
    } | null;

    return {
      success: true,
      data: (payload?.result ?? payload?.data ?? data) as T,
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: new ApiError(
        "NETWORK_ERROR",
        error instanceof Error ? error.message : "Network error",
      ),
    };
  }
}
