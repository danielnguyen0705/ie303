import type { ApiResponse, LoginRequest, RegisterRequest } from "./types";
import { ENV } from "@/config/env";
import { createError, request } from "./utils/http";
const PASSWORD_MIN_LENGTH = 6;

// =========================
// GET CURRENT USER
// =========================
export async function getCurrentUser(): Promise<ApiResponse<any>> {
  return request<any>("/users/me", {
    method: "GET",
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

  const response = await request<string>("/users/me/change-password", {
    method: "PUT",
    body: JSON.stringify({ oldPassword, newPassword }),
  });

  if (!response.success) {
    return {
      success: false,
      error: response.error,
      message: response.message,
    };
  }

  return {
    success: true,
    data: true,
  };
}
