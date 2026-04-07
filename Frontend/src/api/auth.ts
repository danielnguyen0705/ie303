// Authentication API

import { currentUser } from '@/data/mockData';
import { simulateApiCall, createErrorResponse } from './client';
import type { ApiResponse, LoginRequest, RegisterRequest } from './types';
import type { User } from '@/data/mockData';

/**
 * Login user
 */
export async function login(credentials: LoginRequest): Promise<ApiResponse<User>> {
  // Simulate validation
  if (!credentials.email || !credentials.password) {
    createErrorResponse('Email and password are required', 'VALIDATION_ERROR');
  }

  // Mock authentication - accept any credentials for demo
  if (credentials.password.length < 6) {
    createErrorResponse('Invalid credentials', 'AUTH_ERROR');
  }

  return simulateApiCall(currentUser);
}

/**
 * Register new user
 */
export async function register(data: RegisterRequest): Promise<ApiResponse<User>> {
  // Validate
  if (!data.email || !data.password || !data.name) {
    createErrorResponse('All fields are required', 'VALIDATION_ERROR');
  }

  if (data.password.length < 6) {
    createErrorResponse('Password must be at least 6 characters', 'VALIDATION_ERROR');
  }

  // Create new user
  const newUser: User = {
    id: `user-${Date.now()}`,
    name: data.name,
    email: data.email,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.name}`,
    level: 1,
    xp: 0,
    coins: 0,
    streak: 0,
    accuracy: 0,
    joinedDate: new Date().toISOString().split('T')[0],
    vipStatus: 'free',
  };

  return simulateApiCall(newUser);
}

/**
 * Logout user
 */
export async function logout(): Promise<ApiResponse<boolean>> {
  return simulateApiCall(true);
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<ApiResponse<User>> {
  return simulateApiCall(currentUser);
}

/**
 * Refresh token
 */
export async function refreshToken(): Promise<ApiResponse<{ token: string }>> {
  return simulateApiCall({
    token: `mock-token-${Date.now()}`,
  });
}

/**
 * Reset password
 */
export async function resetPassword(email: string): Promise<ApiResponse<boolean>> {
  if (!email) {
    createErrorResponse('Email is required', 'VALIDATION_ERROR');
  }

  return simulateApiCall(true, 1000);
}

/**
 * Change password
 */
export async function changePassword(
  oldPassword: string,
  newPassword: string
): Promise<ApiResponse<boolean>> {
  if (!oldPassword || !newPassword) {
    createErrorResponse('Both passwords are required', 'VALIDATION_ERROR');
  }

  if (newPassword.length < 6) {
    createErrorResponse('New password must be at least 6 characters', 'VALIDATION_ERROR');
  }

  return simulateApiCall(true);
}
