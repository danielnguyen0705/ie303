// API Client - Base utilities for API calls

import type { ApiResponse, ApiError } from './types';

// Simulate network delay
const SIMULATED_DELAY = 500; // ms

// Simulate API call with delay
export async function simulateApiCall<T>(
  data: T,
  delay: number = SIMULATED_DELAY
): Promise<ApiResponse<T>> {
  await new Promise(resolve => setTimeout(resolve, delay));
  
  return {
    success: true,
    data,
  };
}

// Simulate API error
export async function simulateApiError(
  message: string,
  code: string = 'API_ERROR',
  delay: number = SIMULATED_DELAY
): Promise<never> {
  await new Promise(resolve => setTimeout(resolve, delay));
  
  const error: ApiError = {
    code,
    message,
  };
  
  throw error;
}

// Random success/failure for testing
export async function simulateRandomResult<T>(
  data: T,
  successRate: number = 0.9,
  delay: number = SIMULATED_DELAY
): Promise<ApiResponse<T>> {
  await new Promise(resolve => setTimeout(resolve, delay));
  
  if (Math.random() < successRate) {
    return {
      success: true,
      data,
    };
  } else {
    throw {
      code: 'RANDOM_ERROR',
      message: 'Simulated random error',
    } as ApiError;
  }
}

// Error handler
export function handleApiError(error: any): ApiError {
  if (error.code && error.message) {
    return error as ApiError;
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: error.message || 'An unknown error occurred',
    details: error,
  };
}

// Success response wrapper
export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

// Error response wrapper
export function createErrorResponse(message: string, code: string = 'ERROR'): never {
  throw {
    code,
    message,
  } as ApiError;
}
