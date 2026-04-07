// API Index - Central exports for all API modules

// Types
export * from './types';

// Client utilities
export * from './client';

// ============================================
// USER API
// ============================================

// Auth API
export * as authApi from './auth';

// User API
export * as userApi from './users';

// Units API
export * as unitApi from './units';

// Lessons API
export * as lessonApi from './lessons';

// Exercises API
export * as exerciseApi from './exercises';

// Tests API
export * as testApi from './tests';

// Quests & Achievements API
export * as questApi from './quests';

// Leaderboard API
export * as leaderboardApi from './leaderboard';

// Shop API
export * as shopApi from './shop';

// Notifications API
export * as notificationApi from './notifications';

// ============================================
// ADMIN API
// ============================================

// Admin API - All modules
export * as adminApi from './admin';

// Admin Types
export * from './admin/types';

// Re-export for convenience
export {
  // Auth
  login,
  register,
  logout,
  getCurrentUser,
} from './auth';

export {
  // User
  getUserProfile,
  updateUserProfile,
  getUserStats,
  getUserHistory,
} from './users';

export {
  // Units
  getAllUnits,
  getUnit,
  getUnitProgress,
  getCurriculumOverview,
} from './units';

export {
  // Lessons
  getLessonsByUnit,
  getLesson,
  completeLesson,
} from './lessons';

export {
  // Exercises
  getExercise,
  submitExercise,
} from './exercises';

export {
  // Tests
  getTest,
  submitTest,
  getTestResults,
  getTestReview,
} from './tests';

export {
  // Quests
  getAllQuests,
  getActiveQuestsApi,
  claimQuestReward,
  getAllAchievements,
} from './quests';

export {
  // Leaderboard
  getLeaderboard,
  getTopPlayers,
  getUserRank,
  getLeagueInfo,
} from './leaderboard';

export {
  // Shop
  getAllShopItems,
  purchaseItem,
  getPurchasedItems,
  getCoinBalance,
} from './shop';

export {
  // Notifications
  getNotifications,
  getUnreadCount,
  markAsRead,
} from './notifications';