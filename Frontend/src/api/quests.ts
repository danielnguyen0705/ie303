import { request } from "./utils/http";
import { createError } from "./utils/http";
import { clearCachePrefix } from "./utils/cache";
import type {
  ApiResponse,
  ClaimQuestRequest,
  QuestFilter,
  ShopItemType,
} from "./types";

export interface QuestRewardItem {
  shopItemId: number;
  name: string;
  imageUrl: string;
  type: ShopItemType;
  quantity: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: "daily" | "weekly" | "special";
  questType?:
    | "LESSON_COMPLETION"
    | "QUESTION_ANSWERING"
    | "SKIP_USAGE"
    | "LESSON_COMPLETION_WEEKLY"
    | "QUESTION_ANSWERING_WEEKLY"
    | "SKIP_USAGE_WEEKLY";
  progress: number;
  target: number;
  xpReward: number;
  coinsReward: number;
  expiresAt: string;
  status: "active" | "completed" | "claimed";
  rewardItems?: QuestRewardItem[];
}

export interface QuestStats {
  totalCompleted: number;
  totalActive: number;
  totalXPEarned: number;
  totalCoinsEarned: number;
  streakDays: number;
  completionRate: number;
}

export interface QuestClaimResponse {
  quest: Quest;
  rewards: {
    xp: number;
    coins: number;
    items?: QuestRewardItem[];
  };
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

const DEVELOPMENT_NOTE = "Achievements are currently under development.";

export async function getAllQuests(
  _filter?: QuestFilter,
): Promise<ApiResponse<Quest[]>> {
  const response = await request<Quest[]>("/quests", { method: "GET" });

  if (!response.success) {
    return response;
  }

  let quests = response.data ?? [];

  if (_filter?.type) {
    quests = quests.filter((quest) => quest.type === _filter.type);
  }

  if (_filter?.status) {
    quests = quests.filter((quest) => quest.status === _filter.status);
  }

  return {
    success: true,
    data: quests,
  };
}

export async function getActiveQuestsApi(): Promise<ApiResponse<Quest[]>> {
  return getAllQuests();
}

export async function getDailyQuests(): Promise<ApiResponse<Quest[]>> {
  return getAllQuests({ type: "daily" });
}

export async function getWeeklyQuests(): Promise<ApiResponse<Quest[]>> {
  return getAllQuests({ type: "weekly" });
}

export async function getQuest(
  questId: string,
): Promise<ApiResponse<Quest>> {
  const response = await request<Quest>(`/quests/${questId}`, { method: "GET" });

  if (!response.success || !response.data) {
    return createError(
      response.error?.message || "Quest not found",
      response.error?.code || "NOT_FOUND",
    );
  }

  return {
    success: true,
    data: response.data,
  };
}

export async function updateQuestProgress(
  questId: string,
  _progress: number,
): Promise<ApiResponse<Quest>> {
  return getQuest(questId);
}

export async function claimQuestReward(
  data: ClaimQuestRequest,
): Promise<ApiResponse<QuestClaimResponse>> {
  const response = await request<QuestClaimResponse>(
    `/quests/${data.questId}/claim`,
    {
      method: "POST",
    },
  );

  if (!response.success || !response.data) {
    return createError(
      response.error?.message || "Failed to claim quest reward",
      response.error?.code || "API_ERROR",
    );
  }

  const claimedQuest = response.data;

  clearCachePrefix("leaderboard:");
  clearCachePrefix("users:");

  return {
    success: true,
    data: claimedQuest,
  };
}

export async function getQuestStats(): Promise<ApiResponse<QuestStats>> {
  const response = await request<QuestStats>("/quests/stats", {
    method: "GET",
  });

  if (!response.success || !response.data) {
    return createError(
      response.error?.message || "Failed to fetch quest stats",
      response.error?.code || "API_ERROR",
    );
  }

  return {
    success: true,
    data: response.data,
  };
}

export async function getAllAchievements(): Promise<ApiResponse<Achievement[]>> {
  const response = await request<Achievement[]>("/quests/badges", {
    method: "GET",
  });

  if (!response.success) {
    return response;
  }

  return {
    success: true,
    data: response.data ?? [],
  };
}

export async function getUnlockedAchievementsApi(): Promise<
  ApiResponse<Achievement[]>
> {
  return getAllAchievements();
}

export async function getAchievementsByCategory(
  _category: "learning" | "social" | "streak" | "mastery" | "special",
): Promise<ApiResponse<Achievement[]>> {
  return getAllAchievements();
}

export async function getAchievement(
  _achievementId: string,
): Promise<ApiResponse<Achievement>> {
  return createError("Achievements are currently under development.", "NOT_SUPPORTED");
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
  return createError("Achievements are currently under development.", "NOT_SUPPORTED");
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
  return createError("Achievements are currently under development.", "NOT_SUPPORTED");
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
  return createError("Achievements are currently under development.", "NOT_SUPPORTED");
}
