import { ENV } from "@/config/env";
import { ApiError, type ApiResponse } from "../types";
import { readCache, writeCache } from "./cache";

const BASE_URL = ENV.API_BASE_URL;
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

export function createError(
  message: string,
  code: string = "ERROR",
): ApiResponse<never> {
  return {
    success: false,
    error: new ApiError(code, message),
  };
}

export type RequestCacheOptions = {
  key?: string;
  ttlMs?: number;
  storage?: Storage;
};

export async function request<T>(
  url: string,
  options: RequestInit,
  cacheOptions?: RequestCacheOptions,
): Promise<ApiResponse<T>> {
  const method = String(options.method ?? "GET").toUpperCase();
  const shouldUseCache = method === "GET" && Boolean(cacheOptions?.key);

  if (shouldUseCache && cacheOptions?.key) {
    const cachedResponse = readCache<ApiResponse<T>>(
      cacheOptions.key,
      cacheOptions.storage,
    );

    if (cachedResponse) {
      return cachedResponse;
    }
  }

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
    const response: ApiResponse<T> = payload && typeof payload === "object" && "result" in payload
      ? {
          success: true,
          data: payload.result as T,
        }
      : payload && typeof payload === "object" && "data" in payload
        ? {
            success: true,
            data: payload.data as T,
          }
        : {
            success: true,
            data: data as T,
          };

    if (shouldUseCache && cacheOptions?.key) {
      writeCache(
        cacheOptions.key,
        response,
        cacheOptions.ttlMs ?? DEFAULT_CACHE_TTL_MS,
        cacheOptions.storage,
      );
    }

    return response;
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
