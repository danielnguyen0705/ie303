// API Client - Base utilities for API calls

import { ApiError, type ApiResponse } from "./types";

const UNKNOWN_ERROR_CODE = "UNKNOWN_ERROR";
const UNKNOWN_ERROR_MESSAGE = "An unknown error occurred";

// Error handler
export function handleApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new ApiError(UNKNOWN_ERROR_CODE, error.message, error);
  }

  return new ApiError(UNKNOWN_ERROR_CODE, UNKNOWN_ERROR_MESSAGE, error);
}

// Success response wrapper
export function createSuccessResponse<T>(
  payload: T,
  message?: string,
): ApiResponse<T> {
  return {
    success: true,
    data: payload,
    message,
  };
}

// Error response wrapper
export function createErrorResponse(
  message: string,
  code: string = "ERROR",
): ApiResponse<never> {
  return {
    success: false,
    error: new ApiError(code, message),
  };
}
