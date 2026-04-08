// API Client - Base utilities for API calls

import { ApiError, type ApiResponse } from "./types";
import {
  DEFAULT_SIMULATED_DELAY_MS,
  DEFAULT_SUCCESS_RATE,
  isSuccess,
  sleep,
} from "./utils/async";

const RANDOM_ERROR_CODE = "RANDOM_ERROR";
const RANDOM_ERROR_MESSAGE = "Simulated random error";
const UNKNOWN_ERROR_CODE = "UNKNOWN_ERROR";
const UNKNOWN_ERROR_MESSAGE = "An unknown error occurred";

// Simulate API call with delay
export async function simulateApiCall<T>(
  payload: T,
  delayMs: number = DEFAULT_SIMULATED_DELAY_MS,
): Promise<ApiResponse<T>> {
  await sleep(delayMs);

  return {
    success: true,
    data: payload,
  };
}

// Simulate API error
export async function simulateApiError(
  message: string,
  code: string = "API_ERROR",
  delayMs: number = DEFAULT_SIMULATED_DELAY_MS,
): Promise<ApiResponse<never>> {
  await sleep(delayMs);

  return createErrorResponse(message, code);
}

// Random success/failure for testing
export async function simulateRandomResult<T>(
  payload: T,
  successRate: number = DEFAULT_SUCCESS_RATE,
  delayMs: number = DEFAULT_SIMULATED_DELAY_MS,
): Promise<ApiResponse<T>> {
  await sleep(delayMs);

  if (isSuccess(successRate)) {
    return {
      success: true,
      data: payload,
    };
  }

  return createErrorResponse(RANDOM_ERROR_MESSAGE, RANDOM_ERROR_CODE);
}

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
