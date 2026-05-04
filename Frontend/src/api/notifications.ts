// Notifications API (placeholder)
//
// The backend currently handles notifications through email workflows only.
// We keep this module as a development placeholder so the UI can show an
// explicit "under development" state instead of shipping mock data.

import { createSuccessResponse } from "./client";
import type { ApiResponse } from "./types";

export interface UserNotification {
  id: string;
  type: "info" | "success" | "warning" | "error" | "achievement" | "quest" | "social";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
  icon?: string;
  imageUrl?: string;
}

const DEVELOPMENT_NOTE = "Notifications are under development.";

export async function getNotifications(
  _limit: number = 20,
  _unreadOnly: boolean = false,
): Promise<ApiResponse<UserNotification[]>> {
  return createSuccessResponse([], DEVELOPMENT_NOTE);
}

export async function getUnreadCount(): Promise<ApiResponse<number>> {
  return createSuccessResponse(0, DEVELOPMENT_NOTE);
}

export async function markAsRead(
  _notificationId: string,
): Promise<ApiResponse<boolean>> {
  return createSuccessResponse(true, DEVELOPMENT_NOTE);
}

export async function markAllAsRead(): Promise<ApiResponse<boolean>> {
  return createSuccessResponse(true, DEVELOPMENT_NOTE);
}

export async function deleteNotification(
  _notificationId: string,
): Promise<ApiResponse<boolean>> {
  return createSuccessResponse(true, DEVELOPMENT_NOTE);
}

export async function deleteAllNotifications(): Promise<ApiResponse<boolean>> {
  return createSuccessResponse(true, DEVELOPMENT_NOTE);
}

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
  return createSuccessResponse(
    {
      email: {
        achievements: false,
        quests: false,
        streak: false,
        leaderboard: false,
        newContent: false,
      },
      push: {
        achievements: false,
        quests: false,
        streak: false,
        leaderboard: false,
        newContent: false,
      },
      inApp: {
        achievements: false,
        quests: false,
        streak: false,
        leaderboard: false,
        newContent: false,
      },
    },
    DEVELOPMENT_NOTE,
  );
}

export async function updateNotificationPreferences(_preferences: {
  email?: Record<string, boolean>;
  push?: Record<string, boolean>;
  inApp?: Record<string, boolean>;
}): Promise<ApiResponse<boolean>> {
  return createSuccessResponse(true, DEVELOPMENT_NOTE);
}

export async function subscribeToPush(
  _subscription: PushSubscription,
): Promise<ApiResponse<boolean>> {
  return createSuccessResponse(true, DEVELOPMENT_NOTE);
}

export async function unsubscribeFromPush(): Promise<ApiResponse<boolean>> {
  return createSuccessResponse(true, DEVELOPMENT_NOTE);
}
