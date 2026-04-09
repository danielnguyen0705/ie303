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
    const res = await fetch(`${BASE_URL}${url}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    let data: unknown = null;

    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      const errorPayload = data as { code?: string; message?: string } | null;
      return {
        success: false,
        error: new ApiError(
          errorPayload?.code || "API_ERROR",
          errorPayload?.message || `Error ${res.status}`,
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
