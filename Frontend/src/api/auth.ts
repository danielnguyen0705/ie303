// Authentication API (REAL)

import type { ApiResponse, LoginRequest, RegisterRequest } from "./types";
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
