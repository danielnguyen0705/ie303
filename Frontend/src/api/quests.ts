// Quests & Achievements API
//
// This module is intentionally minimal for now.
// The backend does not expose a quest/achievement API yet, so we keep the
// frontend contract stable while returning empty data with a development note.

import { createSuccessResponse } from "./client";
import type { ApiResponse, ClaimQuestRequest, QuestFilter } from "./types";

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: "daily" | "weekly" | "special";
  progress: number;
  target: number;
  xpReward: number;
  coinsReward: number;
  expiresAt: string;
  status: "active" | "completed" | "claimed";
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "learning" | "social" | "streak" | "mastery" | "special";
  isLocked: boolean;
  progress?: number;
  requirement?: number;
  unlockedAt?: string;
}

const DEVELOPMENT_NOTE = "Quests are currently under development.";

function emptyQuests(): Quest[] {
  return [];
}

function emptyAchievements(): Achievement[] {
  return [];
}

export async function getAllQuests(
  _filter?: QuestFilter,
): Promise<ApiResponse<Quest[]>> {
  return createSuccessResponse(emptyQuests(), DEVELOPMENT_NOTE);
}

export async function getActiveQuestsApi(): Promise<ApiResponse<Quest[]>> {
  return createSuccessResponse(emptyQuests(), DEVELOPMENT_NOTE);
}

export async function getDailyQuests(): Promise<ApiResponse<Quest[]>> {
  return createSuccessResponse(emptyQuests(), DEVELOPMENT_NOTE);
}

export async function getWeeklyQuests(): Promise<ApiResponse<Quest[]>> {
  return createSuccessResponse(emptyQuests(), DEVELOPMENT_NOTE);
}

export async function getQuest(
  _questId: string,
): Promise<ApiResponse<Quest>> {
  return createSuccessResponse(null as never, DEVELOPMENT_NOTE);
}

export async function updateQuestProgress(
  _questId: string,
  _progress: number,
): Promise<ApiResponse<Quest>> {
  return createSuccessResponse(null as never, DEVELOPMENT_NOTE);
}

export async function claimQuestReward(
  _data: ClaimQuestRequest,
): Promise<
  ApiResponse<{
    quest: Quest;
    rewards: {
      xp: number;
      coins: number;
      items?: string[];
    };
  }>
> {
  return createSuccessResponse(null as never, DEVELOPMENT_NOTE);
}

export async function getQuestStats(): Promise<
  ApiResponse<{
    totalCompleted: number;
    totalActive: number;
    totalXPEarned: number;
    totalCoinsEarned: number;
    streakDays: number;
    completionRate: number;
  }>
> {
  return createSuccessResponse(
    {
      totalCompleted: 0,
      totalActive: 0,
      totalXPEarned: 0,
      totalCoinsEarned: 0,
      streakDays: 0,
      completionRate: 0,
    },
    DEVELOPMENT_NOTE,
  );
}

export async function getAllAchievements(): Promise<ApiResponse<Achievement[]>> {
  return createSuccessResponse(emptyAchievements(), DEVELOPMENT_NOTE);
}

export async function getUnlockedAchievementsApi(): Promise<
  ApiResponse<Achievement[]>
> {
  return createSuccessResponse(emptyAchievements(), DEVELOPMENT_NOTE);
}

export async function getAchievementsByCategory(
  _category: "learning" | "social" | "streak" | "mastery" | "special",
): Promise<ApiResponse<Achievement[]>> {
  return createSuccessResponse(emptyAchievements(), DEVELOPMENT_NOTE);
}

export async function getAchievement(
  _achievementId: string,
): Promise<ApiResponse<Achievement>> {
  return createSuccessResponse(null as never, DEVELOPMENT_NOTE);
}

export async function unlockAchievement(
  _achievementId: string,
): Promise<
  ApiResponse<{
    achievement: Achievement;
    rewards: {
      xp: number;
      coins: number;
      badge: string;
    };
  }>
> {
  return createSuccessResponse(null as never, DEVELOPMENT_NOTE);
}

export async function getAchievementProgress(
  _achievementId: string,
): Promise<
  ApiResponse<{
    achievementId: string;
    progress: number;
    requirement: number;
    percentage: number;
    isUnlocked: boolean;
  }>
> {
  return createSuccessResponse(
    {
      achievementId: "",
      progress: 0,
      requirement: 0,
      percentage: 0,
      isUnlocked: false,
    },
    DEVELOPMENT_NOTE,
  );
}

export async function getAchievementStats(): Promise<
  ApiResponse<{
    totalAchievements: number;
    unlockedCount: number;
    lockedCount: number;
    completionRate: number;
    recentUnlocks: Achievement[];
    nextToUnlock: Achievement[];
  }>
> {
  return createSuccessResponse(
    {
      totalAchievements: 0,
      unlockedCount: 0,
      lockedCount: 0,
      completionRate: 0,
      recentUnlocks: [],
      nextToUnlock: [],
    },
    DEVELOPMENT_NOTE,
  );
}
