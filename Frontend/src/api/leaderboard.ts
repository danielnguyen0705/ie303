// Leaderboard API

import { leaderboard, currentUser } from '@/data/mockData';
import { simulateApiCall } from './client';
import type { ApiResponse, LeaderboardFilter, PaginatedResponse } from './types';
import type { LeaderboardEntry } from '@/data/mockData';

/**
 * Get leaderboard
 */
export async function getLeaderboard(
  filter?: LeaderboardFilter,
  page: number = 1,
  pageSize: number = 10
): Promise<ApiResponse<PaginatedResponse<LeaderboardEntry>>> {
  let filteredLeaderboard = [...leaderboard];

  // Filter by league
  if (filter?.league) {
    filteredLeaderboard = filteredLeaderboard.filter(e => e.league === filter.league);
  }

  // Pagination
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedData = filteredLeaderboard.slice(start, end);

  return simulateApiCall({
    data: paginatedData,
    total: filteredLeaderboard.length,
    page,
    pageSize,
    hasMore: end < filteredLeaderboard.length,
  });
}

/**
 * Get top players
 */
export async function getTopPlayers(limit: number = 10): Promise<ApiResponse<LeaderboardEntry[]>> {
  const top = leaderboard.slice(0, limit);
  return simulateApiCall(top);
}

/**
 * Get user rank
 */
export async function getUserRank(userId?: string): Promise<
  ApiResponse<{
    rank: number;
    entry: LeaderboardEntry;
    percentile: number;
  }>
> {
  const targetUserId = userId || currentUser.id;
  const userEntry = leaderboard.find(e => e.userId === targetUserId);

  if (!userEntry) {
    return simulateApiCall({
      rank: leaderboard.length + 1,
      entry: {
        rank: leaderboard.length + 1,
        userId: targetUserId,
        name: currentUser.name,
        avatar: currentUser.avatar,
        xp: currentUser.xp,
        streak: currentUser.streak,
        accuracy: currentUser.accuracy,
        level: currentUser.level,
        league: 'bronze',
      },
      percentile: 0,
    });
  }

  return simulateApiCall({
    rank: userEntry.rank,
    entry: userEntry,
    percentile: ((leaderboard.length - userEntry.rank + 1) / leaderboard.length) * 100,
  });
}

/**
 * Get nearby players (players ranked close to current user)
 */
export async function getNearbyPlayers(
  userId?: string,
  range: number = 5
): Promise<ApiResponse<LeaderboardEntry[]>> {
  const targetUserId = userId || currentUser.id;
  const userIndex = leaderboard.findIndex(e => e.userId === targetUserId);

  if (userIndex === -1) {
    return simulateApiCall(leaderboard.slice(0, range * 2 + 1));
  }

  const start = Math.max(0, userIndex - range);
  const end = Math.min(leaderboard.length, userIndex + range + 1);

  return simulateApiCall(leaderboard.slice(start, end));
}

/**
 * Get leaderboard by league
 */
export async function getLeagueLeaderboard(
  league: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
): Promise<ApiResponse<LeaderboardEntry[]>> {
  const leagueEntries = leaderboard.filter(e => e.league === league);
  return simulateApiCall(leagueEntries);
}

/**
 * Get league info
 */
export async function getLeagueInfo(userId?: string): Promise<
  ApiResponse<{
    currentLeague: string;
    rankInLeague: number;
    totalInLeague: number;
    xpToNextLeague: number;
    promotionZone: boolean;
    relegationZone: boolean;
  }>
> {
  const targetUserId = userId || currentUser.id;
  const userEntry = leaderboard.find(e => e.userId === targetUserId);

  if (!userEntry) {
    return simulateApiCall({
      currentLeague: 'bronze',
      rankInLeague: 1,
      totalInLeague: 1,
      xpToNextLeague: 5000,
      promotionZone: false,
      relegationZone: false,
    });
  }

  const leagueEntries = leaderboard.filter(e => e.league === userEntry.league);
  const rankInLeague = leagueEntries.findIndex(e => e.userId === targetUserId) + 1;

  return simulateApiCall({
    currentLeague: userEntry.league,
    rankInLeague,
    totalInLeague: leagueEntries.length,
    xpToNextLeague: 5000,
    promotionZone: rankInLeague <= 3,
    relegationZone: rankInLeague > leagueEntries.length - 3,
  });
}

/**
 * Get weekly leaderboard
 */
export async function getWeeklyLeaderboard(): Promise<ApiResponse<LeaderboardEntry[]>> {
  // In real app, this would show different data
  return simulateApiCall(leaderboard);
}

/**
 * Get monthly leaderboard
 */
export async function getMonthlyLeaderboard(): Promise<ApiResponse<LeaderboardEntry[]>> {
  return simulateApiCall(leaderboard);
}

/**
 * Get friends leaderboard
 */
export async function getFriendsLeaderboard(): Promise<ApiResponse<LeaderboardEntry[]>> {
  // Mock: return random subset
  const friends = leaderboard.slice(0, 5);
  return simulateApiCall(friends);
}

/**
 * Get leaderboard statistics
 */
export async function getLeaderboardStats(): Promise<
  ApiResponse<{
    totalPlayers: number;
    averageXP: number;
    averageLevel: number;
    averageAccuracy: number;
    topXP: number;
    leagueDistribution: Record<string, number>;
  }>
> {
  const leagueDistribution = leaderboard.reduce((acc, entry) => {
    acc[entry.league] = (acc[entry.league] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return simulateApiCall({
    totalPlayers: leaderboard.length,
    averageXP: Math.round(leaderboard.reduce((sum, e) => sum + e.xp, 0) / leaderboard.length),
    averageLevel: Math.round(leaderboard.reduce((sum, e) => sum + e.level, 0) / leaderboard.length),
    averageAccuracy: Math.round(leaderboard.reduce((sum, e) => sum + e.accuracy, 0) / leaderboard.length),
    topXP: leaderboard[0]?.xp || 0,
    leagueDistribution,
  });
}

/**
 * Get season info
 */
export async function getSeasonInfo(): Promise<
  ApiResponse<{
    seasonNumber: number;
    seasonName: string;
    startDate: string;
    endDate: string;
    daysRemaining: number;
    rewards: Array<{
      rank: number;
      xp: number;
      coins: number;
      badge: string;
    }>;
  }>
> {
  return simulateApiCall({
    seasonNumber: 4,
    seasonName: 'Spring Challenge 2026',
    startDate: '2026-04-01',
    endDate: '2026-04-30',
    daysRemaining: 23,
    rewards: [
      { rank: 1, xp: 1000, coins: 500, badge: 'champion-gold' },
      { rank: 2, xp: 750, coins: 350, badge: 'champion-silver' },
      { rank: 3, xp: 500, coins: 250, badge: 'champion-bronze' },
      { rank: 10, xp: 100, coins: 50, badge: 'top-10' },
    ],
  });
}
