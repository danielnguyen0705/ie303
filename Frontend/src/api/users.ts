// User API

import { currentUser } from '@/data/mockData';
import { simulateApiCall, createErrorResponse } from './client';
import type { ApiResponse, UpdateProfileRequest } from './types';
import type { User } from '@/data/mockData';

/**
 * Get user profile
 */
export async function getUserProfile(userId?: string): Promise<ApiResponse<User>> {
  // If no userId provided, return current user
  if (!userId || userId === currentUser.id) {
    return simulateApiCall(currentUser);
  }

  // In real app, fetch from server
  return createErrorResponse('User not found', 'NOT_FOUND');
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  data: UpdateProfileRequest
): Promise<ApiResponse<User>> {
  const updatedUser: User = {
    ...currentUser,
    ...data,
  };

  return simulateApiCall(updatedUser);
}

/**
 * Upload avatar
 */
export async function uploadAvatar(file: File): Promise<ApiResponse<{ url: string }>> {
  // Simulate file upload
  const mockUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`;
  
  return simulateApiCall({ url: mockUrl }, 1500);
}

/**
 * Get user stats
 */
export async function getUserStats(): Promise<
  ApiResponse<{
    totalLessonsCompleted: number;
    totalTestsTaken: number;
    averageScore: number;
    totalXP: number;
    totalCoins: number;
    currentStreak: number;
    longestStreak: number;
    accuracy: number;
  }>
> {
  return simulateApiCall({
    totalLessonsCompleted: 24,
    totalTestsTaken: 8,
    averageScore: 87.5,
    totalXP: currentUser.xp,
    totalCoins: currentUser.coins,
    currentStreak: currentUser.streak,
    longestStreak: 28,
    accuracy: currentUser.accuracy,
  });
}

/**
 * Get user learning history
 */
export async function getUserHistory(
  limit: number = 10
): Promise<
  ApiResponse<
    Array<{
      id: string;
      type: 'lesson' | 'test' | 'exercise';
      title: string;
      completedAt: string;
      score: number;
      xpGained: number;
    }>
  >
> {
  const history = [
    {
      id: 'hist-001',
      type: 'lesson' as const,
      title: 'Present Simple & Adverbs',
      completedAt: '2026-04-07T14:30:00Z',
      score: 92,
      xpGained: 15,
    },
    {
      id: 'hist-002',
      type: 'exercise' as const,
      title: 'Listening - Health Tips',
      completedAt: '2026-04-07T10:15:00Z',
      score: 88,
      xpGained: 10,
    },
    {
      id: 'hist-003',
      type: 'test' as const,
      title: 'Unit 1 Final Test',
      completedAt: '2026-04-06T16:20:00Z',
      score: 96,
      xpGained: 20,
    },
  ].slice(0, limit);

  return simulateApiCall(history);
}

/**
 * Update user preferences
 */
export async function updatePreferences(preferences: {
  notifications?: boolean;
  soundEffects?: boolean;
  language?: string;
  theme?: 'light' | 'dark' | 'auto';
}): Promise<ApiResponse<boolean>> {
  return simulateApiCall(true);
}

/**
 * Delete user account
 */
export async function deleteAccount(password: string): Promise<ApiResponse<boolean>> {
  if (!password) {
    return createErrorResponse('Password is required', 'VALIDATION_ERROR');
  }

  return simulateApiCall(true, 1000);
}
