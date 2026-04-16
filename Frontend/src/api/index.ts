// API Index - Central exports for all API modules

// Types
export * from "./types";

// Client utilities
export * from "./client";

// ============================================
// USER API
// ============================================

// Auth API
export * as authApi from "./auth";

// User API
export * as userApi from "./users";

// Units API
export * as unitApi from "./units";

// Lessons API
export * as lessonApi from "./lessons";

// Exercises API
export * as exerciseApi from "./exercises";

// Tests API
export * as testApi from "./tests";

// Quests & Achievements API
export * as questApi from "./quests";

// Leaderboard API
export * as leaderboardApi from "./leaderboard";

// Shop API
export * as shopApi from "./shop";

// Notifications API
export * as notificationApi from "./notifications";

// Payments API
export * as paymentApi from "./payments";

export * as gradeApi from "./grades";
export * as sectionApi from "./sections";
export * as questionApi from "./questions";

// ============================================
// ADMIN API
// ============================================

// Admin API - All modules
export * as adminApi from "./admin";

// Re-export for convenience
export {
  // Auth
  login,
  register,
  logout,
  getCurrentUser,
} from "./auth";

export {
  // User
  getUserProfile,
  updateUserProfile,
  getUserStats,
  getUserHistory,
} from "./users";

export { getUnitsByGradeProgress, getUnit } from "./units";

export { getAllGrades, getGrade } from "./grades";

export { getSectionsByUnitProgress, getSection } from "./sections";

export { getQuestionsByLesson } from "./questions";

export { getLessonsBySectionProgress } from "./lessons";

export {
  // Exercises
  getExercise,
  submitExercise,
} from "./exercises";

export {
  // Tests
  getTest,
  submitTest,
  getTestResults,
  getTestReview,
} from "./tests";

export {
  // Quests
  getAllQuests,
  getActiveQuestsApi,
  claimQuestReward,
  getAllAchievements,
} from "./quests";

export {
  // Leaderboard
  getCoinLeaderboard,
  getExpLeaderboard,
  getCollectorLeaderboard,
} from "./leaderboard";

export {
  // Shop
  getActiveShopItems,
  getMyShopItems,
  getAllShopItems,
  buyShopItem,
  purchaseItem,
  getPurchasedItems,
  useSkipItem,
  equipAvatar,
  equipBackground,
  getCoinBalance,
} from "./shop";

export {
  // Notifications
  getNotifications,
  getUnreadCount,
  markAsRead,
} from "./notifications";

export {
  // Payments
  getActivePaymentOffers,
  createCheckoutTransaction,
  paymentWebhook,
  mockConfirmPayment,
  getMyTransactions,
  getMyTransactionDetail,
  cancelMyTransaction,
} from "./payments";
