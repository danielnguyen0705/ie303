// Authentication API (REAL)

import type { ApiResponse, LoginRequest, RegisterRequest } from "./types";
import { ENV } from "@/config/env";
import { createError, request } from "./utils/http";

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
// OAUTH2 GOOGLE LOGIN
// =========================
export function getGoogleOAuth2AuthorizeUrl(): string {
  return `${ENV.BACKEND_BASE_URL}/oauth2/authorization/google`;
}
