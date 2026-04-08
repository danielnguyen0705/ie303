// Authentication API (REAL)

import type { ApiResponse, LoginRequest, RegisterRequest } from "./types";
import { ApiError } from "./types";
import { ENV } from "@/config/env";

const BASE_URL = ENV.API_BASE_URL;

// =========================
// HELPER
// =========================
function createError(message: string, code: string): ApiResponse<never> {
  return {
    success: false,
    error: new ApiError(code, message),
  };
}

async function request<T>(
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

    let data: any = null;

    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      return {
        success: false,
        error: new ApiError(
          data?.code || "API_ERROR",
          data?.message || `Error ${res.status}`,
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

const PASSWORD_MIN_LENGTH = 6;

// =========================
// LOGIN
// =========================
export async function login(
  credentials: LoginRequest,
): Promise<ApiResponse<any>> {
  if (!credentials.username || !credentials.password) {
    return createError(
      "Username and password are required",
      "VALIDATION_ERROR",
    );
  }

  if (credentials.password.length < PASSWORD_MIN_LENGTH) {
    return createError("Invalid credentials", "AUTH_ERROR");
  }

  return request<any>("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

// =========================
// REGISTER
// =========================
export async function register(
  payload: RegisterRequest,
): Promise<ApiResponse<any>> {
  if (!payload.email || !payload.password || !payload.username) {
    return createError("All fields are required", "VALIDATION_ERROR");
  }

  if (payload.password.length < PASSWORD_MIN_LENGTH) {
    return createError(
      "Password must be at least 6 characters",
      "VALIDATION_ERROR",
    );
  }

  return request<any>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// =========================
// LOGOUT
// =========================
export async function logout(): Promise<ApiResponse<boolean>> {
  return request<boolean>("/auth/logout", {
    method: "POST",
  });
}

// =========================
// GET CURRENT USER
// =========================
export async function getCurrentUser(): Promise<ApiResponse<any>> {
  return request<any>("/users/me", {
    method: "GET",
  });
}

// =========================
// REFRESH TOKEN
// =========================
export async function refreshToken(): Promise<ApiResponse<any>> {
  return request<any>("/auth/refresh-token", {
    method: "POST",
  });
}

// =========================
// RESET PASSWORD
// =========================
export async function resetPassword(
  email: string,
): Promise<ApiResponse<boolean>> {
  if (!email) {
    return createError("Email is required", "VALIDATION_ERROR");
  }

  return request<boolean>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

// =========================
// CHANGE PASSWORD
// =========================
export async function changePassword(
  oldPassword: string,
  newPassword: string,
): Promise<ApiResponse<boolean>> {
  if (!oldPassword || !newPassword) {
    return createError("Both passwords are required", "VALIDATION_ERROR");
  }

  if (newPassword.length < PASSWORD_MIN_LENGTH) {
    return createError(
      "New password must be at least 6 characters",
      "VALIDATION_ERROR",
    );
  }

  return request<boolean>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ oldPassword, newPassword }),
  });
}
