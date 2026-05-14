import type { ApiResponse } from "./types";
import { createError, request } from "./utils/http";

const PASSWORD_MIN_LENGTH = 6;

type StudyingGrade = {
  gradeId: number;
  gradeName: string;
  progressPercent: number;
};

type UserProfilePayload = {
  id: number;
  username: string;
  email: string;
  avatar?: string | null;
  role: string;
  coin: number;
  exp: number;
  score: number;
  streak: number;
  lastStudyDate: string | null;
  vipExpiredAt: string | null;
  isVip: boolean;
  createdAt: string;
  studyingGrades?: StudyingGrade[];
};

type LearningStats = {
  totalLessonsCompleted: number;
  totalTestsTaken: number;
  averageScore: number;
  totalXP: number;
  totalCoins: number;
  currentStreak: number;
  longestStreak: number;
  accuracy: number;
};

type HistoryItem = {
  id: string;
  type: "lesson" | "test" | "exercise";
  title: string;
  completedAt: string;
  score: number;
  xpGained: number;
};

type ActivityCalendarDay = {
  date: string;
  studied: boolean;
  skipUsed: boolean;
  studyCount: number;
  skipCount: number;
};

type ActivityCalendarResponse = {
  year: number;
  month: number;
  monthLabel: string;
  totalStudyDays: number;
  totalSkipDays: number;
  days: ActivityCalendarDay[];
};

function calculateLevel(exp: number): number {
  return Math.max(1, Math.floor(exp / 300) + 1);
}

function toVipStatus(isVip: boolean): "free" | "premium" {
  return isVip ? "premium" : "free";
}

function buildDefaultAvatar(seed: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
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

// =========================
// GET USER PROFILE
// =========================
export async function getUserProfile(): Promise<
  ApiResponse<{
    id: string;
    name: string;
    email: string;
    avatar: string;
    level: number;
    xp: number;
    coins: number;
    streak: number;
    accuracy: number;
    joinedDate: string;
    vipStatus: "free" | "premium";
    studyingGrades: StudyingGrade[];
  }>
> {
  const response = await getCurrentUser();
  if (!response.success || !response.data) {
    return response;
  }

  const user = response.data as UserProfilePayload;

  return {
    success: true,
    data: {
      id: String(user.id),
      name: user.username,
      email: user.email,
      avatar:
        user.avatar ||
        buildDefaultAvatar(user.username || user.email || "user"),
      level: calculateLevel(user.exp),
      xp: user.exp,
      coins: user.coin,
      streak: user.streak,
      accuracy: 0,
      joinedDate: user.createdAt,
      vipStatus: toVipStatus(user.isVip),
      studyingGrades: user.studyingGrades ?? [],
    },
  };
}

// =========================
// GET USER STATS
// =========================
export async function getUserStats(): Promise<ApiResponse<LearningStats>> {
  const response = await getCurrentUser();
  if (!response.success || !response.data) {
    return response as ApiResponse<LearningStats>;
  }

  const user = response.data as UserProfilePayload;

  return {
    success: true,
    data: {
      totalLessonsCompleted: 0,
      totalTestsTaken: 0,
      averageScore: 0,
      totalXP: user.exp,
      totalCoins: user.coin,
      currentStreak: user.streak,
      longestStreak: user.streak,
      accuracy: 0,
    },
  };
}

// =========================
// GET USER HISTORY
// =========================
export async function getUserHistory(
  _limit: number = 10,
): Promise<ApiResponse<HistoryItem[]>> {
  return {
    success: true,
    data: [],
  };
}

// =========================
// GET USER ACTIVITY CALENDAR
// =========================
export async function getMyActivityCalendar(
  year?: number,
  month?: number,
): Promise<ApiResponse<ActivityCalendarResponse>> {
  const query = new URLSearchParams();

  if (typeof year === "number") {
    query.set("year", String(year));
  }

  if (typeof month === "number") {
    query.set("month", String(month));
  }

  const path = query.toString()
    ? `/users/me/activity-calendar?${query.toString()}`
    : "/users/me/activity-calendar";

  return request<ActivityCalendarResponse>(path, {
    method: "GET",
  }, {
    key: `users:activity-calendar:${year ?? "all"}:${month ?? "all"}`,
    ttlMs: 2 * 60 * 1000,
  });
}
