// Notifications API (User-facing)

import { simulateApiCall } from './client';
import type { ApiResponse } from './types';

export interface UserNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'achievement' | 'quest' | 'social';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
  icon?: string;
  imageUrl?: string;
}

/**
 * Get user notifications
 */
export async function getNotifications(
  limit: number = 20,
  unreadOnly: boolean = false
): Promise<ApiResponse<UserNotification[]>> {
  const notifications: UserNotification[] = [
    {
      id: 'notif-001',
      type: 'achievement',
      title: 'New Achievement Unlocked!',
      message: 'You earned the "Week Warrior" badge for maintaining a 7-day streak!',
      isRead: false,
      createdAt: '2026-04-07T15:00:00Z',
      actionUrl: '/profile',
      actionLabel: 'View Achievements',
      icon: '🏆',
    },
    {
      id: 'notif-002',
      type: 'quest',
      title: 'Quest Completed!',
      message: 'You completed "Practice Listening" and earned 20 XP and 10 coins!',
      isRead: false,
      createdAt: '2026-04-07T14:30:00Z',
      actionUrl: '/quests',
      actionLabel: 'View Quests',
      icon: '✅',
    },
    {
      id: 'notif-003',
      type: 'info',
      title: 'New Units Available',
      message: 'Units 6-8 are now unlocked! Start learning today.',
      isRead: true,
      createdAt: '2026-04-06T09:00:00Z',
      actionUrl: '/units',
      actionLabel: 'Browse Units',
      icon: '📚',
    },
    {
      id: 'notif-004',
      type: 'warning',
      title: 'Streak at Risk!',
      message: 'Complete at least one activity today to maintain your 15-day streak.',
      isRead: false,
      createdAt: '2026-04-07T20:00:00Z',
      actionUrl: '/',
      actionLabel: 'Start Learning',
      icon: '🔥',
    },
    {
      id: 'notif-005',
      type: 'success',
      title: 'Test Passed!',
      message: 'Great job! You scored 85% on Unit 2 Post-test.',
      isRead: true,
      createdAt: '2026-04-06T16:30:00Z',
      actionUrl: '/test/results',
      actionLabel: 'View Results',
      icon: '🎉',
    },
    {
      id: 'notif-006',
      type: 'social',
      title: 'New Rank Achieved!',
      message: 'You climbed to #9 on the leaderboard. Keep going!',
      isRead: true,
      createdAt: '2026-04-05T12:00:00Z',
      actionUrl: '/leaderboard',
      actionLabel: 'View Leaderboard',
      icon: '⭐',
    },
  ];

  let filtered = notifications;
  if (unreadOnly) {
    filtered = filtered.filter(n => !n.isRead);
  }

  return simulateApiCall(filtered.slice(0, limit));
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<ApiResponse<number>> {
  return simulateApiCall(3);
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<ApiResponse<boolean>> {
  return simulateApiCall(true);
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<ApiResponse<boolean>> {
  return simulateApiCall(true);
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string): Promise<ApiResponse<boolean>> {
  return simulateApiCall(true);
}

/**
 * Delete all notifications
 */
export async function deleteAllNotifications(): Promise<ApiResponse<boolean>> {
  return simulateApiCall(true);
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(): Promise<
  ApiResponse<{
    email: {
      achievements: boolean;
      quests: boolean;
      streak: boolean;
      leaderboard: boolean;
      newContent: boolean;
    };
    push: {
      achievements: boolean;
      quests: boolean;
      streak: boolean;
      leaderboard: boolean;
      newContent: boolean;
    };
    inApp: {
      achievements: boolean;
      quests: boolean;
      streak: boolean;
      leaderboard: boolean;
      newContent: boolean;
    };
  }>
> {
  return simulateApiCall({
    email: {
      achievements: true,
      quests: true,
      streak: true,
      leaderboard: false,
      newContent: true,
    },
    push: {
      achievements: true,
      quests: true,
      streak: true,
      leaderboard: true,
      newContent: true,
    },
    inApp: {
      achievements: true,
      quests: true,
      streak: true,
      leaderboard: true,
      newContent: true,
    },
  });
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(preferences: {
  email?: Record<string, boolean>;
  push?: Record<string, boolean>;
  inApp?: Record<string, boolean>;
}): Promise<ApiResponse<boolean>> {
  return simulateApiCall(true);
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(
  subscription: PushSubscription
): Promise<ApiResponse<boolean>> {
  return simulateApiCall(true, 1000);
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<ApiResponse<boolean>> {
  return simulateApiCall(true);
}
