// Quests & Achievements API

import { quests, achievements, getActiveQuests, getUnlockedAchievements } from '@/data/mockData';
import { simulateApiCall, createErrorResponse } from './client';
import type { ApiResponse, QuestFilter, ClaimQuestRequest } from './types';
import type { Quest, Achievement } from '@/data/mockData';

/**
 * Get all quests
 */
export async function getAllQuests(filter?: QuestFilter): Promise<ApiResponse<Quest[]>> {
  let filteredQuests = [...quests];

  if (filter?.type) {
    filteredQuests = filteredQuests.filter(q => q.type === filter.type);
  }

  if (filter?.status) {
    filteredQuests = filteredQuests.filter(q => q.status === filter.status);
  }

  return simulateApiCall(filteredQuests);
}

/**
 * Get active quests
 */
export async function getActiveQuestsApi(): Promise<ApiResponse<Quest[]>> {
  const active = getActiveQuests();
  return simulateApiCall(active);
}

/**
 * Get daily quests
 */
export async function getDailyQuests(): Promise<ApiResponse<Quest[]>> {
  const daily = quests.filter(q => q.type === 'daily');
  return simulateApiCall(daily);
}

/**
 * Get weekly quests
 */
export async function getWeeklyQuests(): Promise<ApiResponse<Quest[]>> {
  const weekly = quests.filter(q => q.type === 'weekly');
  return simulateApiCall(weekly);
}

/**
 * Get single quest
 */
export async function getQuest(questId: string): Promise<ApiResponse<Quest>> {
  const quest = quests.find(q => q.id === questId);
  
  if (!quest) {
    return createErrorResponse('Quest not found', 'NOT_FOUND');
  }

  return simulateApiCall(quest);
}

/**
 * Update quest progress
 */
export async function updateQuestProgress(
  questId: string,
  progress: number
): Promise<ApiResponse<Quest>> {
  const quest = quests.find(q => q.id === questId);
  
  if (!quest) {
    return createErrorResponse('Quest not found', 'NOT_FOUND');
  }

  const updatedQuest: Quest = {
    ...quest,
    progress: Math.min(progress, quest.target),
    status: progress >= quest.target ? 'completed' : 'active',
  };

  return simulateApiCall(updatedQuest);
}

/**
 * Claim quest rewards
 */
export async function claimQuestReward(data: ClaimQuestRequest): Promise<
  ApiResponse<{
    quest: Quest;
    rewards: {
      xp: number;
      coins: number;
      items?: string[];
    };
  }>
> {
  const quest = quests.find(q => q.id === data.questId);
  
  if (!quest) {
    return createErrorResponse('Quest not found', 'NOT_FOUND');
  }

  if (quest.status !== 'completed') {
    return createErrorResponse('Quest is not completed yet', 'INVALID_STATE');
  }

  const claimedQuest: Quest = {
    ...quest,
    status: 'claimed',
  };

  return simulateApiCall({
    quest: claimedQuest,
    rewards: {
      xp: quest.xpReward,
      coins: quest.coinsReward,
    },
  });
}

/**
 * Get quest statistics
 */
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
  const completed = quests.filter(q => q.status === 'completed' || q.status === 'claimed');
  
  return simulateApiCall({
    totalCompleted: completed.length,
    totalActive: quests.filter(q => q.status === 'active').length,
    totalXPEarned: completed.reduce((sum, q) => sum + q.xpReward, 0),
    totalCoinsEarned: completed.reduce((sum, q) => sum + q.coinsReward, 0),
    streakDays: 15,
    completionRate: (completed.length / quests.length) * 100,
  });
}

// ============================================
// ACHIEVEMENTS
// ============================================

/**
 * Get all achievements
 */
export async function getAllAchievements(): Promise<ApiResponse<Achievement[]>> {
  return simulateApiCall(achievements);
}

/**
 * Get unlocked achievements
 */
export async function getUnlockedAchievementsApi(): Promise<ApiResponse<Achievement[]>> {
  const unlocked = getUnlockedAchievements();
  return simulateApiCall(unlocked);
}

/**
 * Get achievements by category
 */
export async function getAchievementsByCategory(
  category: 'learning' | 'social' | 'streak' | 'mastery' | 'special'
): Promise<ApiResponse<Achievement[]>> {
  const filtered = achievements.filter(a => a.category === category);
  return simulateApiCall(filtered);
}

/**
 * Get single achievement
 */
export async function getAchievement(achievementId: string): Promise<ApiResponse<Achievement>> {
  const achievement = achievements.find(a => a.id === achievementId);
  
  if (!achievement) {
    return createErrorResponse('Achievement not found', 'NOT_FOUND');
  }

  return simulateApiCall(achievement);
}

/**
 * Unlock achievement
 */
export async function unlockAchievement(achievementId: string): Promise<
  ApiResponse<{
    achievement: Achievement;
    rewards: {
      xp: number;
      coins: number;
      badge: string;
    };
  }>
> {
  const achievement = achievements.find(a => a.id === achievementId);
  
  if (!achievement) {
    return createErrorResponse('Achievement not found', 'NOT_FOUND');
  }

  if (!achievement.isLocked) {
    return createErrorResponse('Achievement already unlocked', 'INVALID_STATE');
  }

  const unlockedAchievement: Achievement = {
    ...achievement,
    isLocked: false,
    unlockedAt: new Date().toISOString(),
  };

  return simulateApiCall({
    achievement: unlockedAchievement,
    rewards: {
      xp: 25,
      coins: 10,
      badge: achievementId,
    },
  });
}

/**
 * Get achievement progress
 */
export async function getAchievementProgress(achievementId: string): Promise<
  ApiResponse<{
    achievementId: string;
    progress: number;
    requirement: number;
    percentage: number;
    isUnlocked: boolean;
  }>
> {
  const achievement = achievements.find(a => a.id === achievementId);
  
  if (!achievement) {
    return createErrorResponse('Achievement not found', 'NOT_FOUND');
  }

  const progress = achievement.progress || 0;
  const requirement = achievement.requirement || 1;

  return simulateApiCall({
    achievementId,
    progress,
    requirement,
    percentage: Math.round((progress / requirement) * 100),
    isUnlocked: !achievement.isLocked,
  });
}

/**
 * Get achievement statistics
 */
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
  const unlocked = achievements.filter(a => !a.isLocked);
  const locked = achievements.filter(a => a.isLocked);
  
  // Sort locked by progress
  const sortedLocked = locked
    .filter(a => a.progress !== undefined)
    .sort((a, b) => {
      const progressA = ((a.progress || 0) / (a.requirement || 1)) * 100;
      const progressB = ((b.progress || 0) / (b.requirement || 1)) * 100;
      return progressB - progressA;
    });

  return simulateApiCall({
    totalAchievements: achievements.length,
    unlockedCount: unlocked.length,
    lockedCount: locked.length,
    completionRate: (unlocked.length / achievements.length) * 100,
    recentUnlocks: unlocked.slice(0, 3),
    nextToUnlock: sortedLocked.slice(0, 3),
  });
}
