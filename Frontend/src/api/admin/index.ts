// Admin API Index - Central exports for all admin API modules

export * from "./types";
export * from "./content";

// Dashboard API
export * as adminDashboardApi from "./dashboard";

// User Management API
export * as adminUserApi from "./users";

// Content Management API
export * as adminContentApi from "./content";

// Question Bank API
export * as adminQuestionApi from "./questions";

// Reports API
export * as adminReportApi from "./reports";

// VIP Management API
export * as adminVIPApi from "./vip";

// Notifications API
export * as adminNotificationApi from "./notifications";

// Settings API
export * as adminSettingsApi from "./settings";

// Shop Item Management API
export * as adminShopApi from "./shop";

// Activity Logs API
export * as adminActivityApi from "./activityLogs";

// Re-export for convenience
export {
  // Dashboard
  getDashboardStats,
  getAnalytics,
  getRealTimeStats,
  getGrowthMetrics,
  getKPISummary,
  getRecentActivities,
  exportDashboardData,
} from "./dashboard";

export {
  // Users
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  suspendUser,
  activateUser,
  getUserStats,
  getUserActivityLog,
  bulkUpdateUsers,
  bulkDeleteUsers,
  exportUsers,
  getUserLearningPath,
  resetUserPassword,
  assignVIPStatus,
} from "./users";

export {
  // Grades
  getAllGrades,
  createGrade,
  updateGrade,
  deleteGrade,

  // Units
  getAllUnits as getAllUnitsAdmin,
  getUnitsByGrade,
  getUnit as getUnitAdmin,
  createUnit,
  updateUnit,
  deleteUnit,

  // Sections
  getSectionsByUnit,
  getSection,
  createSection,
  updateSection,
  deleteSection,

  // Lessons
  getLessonsBySection,
  getLesson as getLessonAdmin,
  createLesson,
  updateLesson,
  deleteLesson,

  // Content questions
  getQuestionsByLesson,
  createQuestion as createContentQuestion,
  updateQuestion as updateContentQuestion,
  deleteQuestion as deleteContentQuestion,
  createQuestionOption,
  updateQuestionOption,
  deleteQuestionOption,
  createQuestionGroup,
  updateQuestionGroup,
  deleteQuestionGroup,

  // convenience
  getAllUnits,
  getUnit,
  getLesson,
} from "./content";

export {
  // Question bank
  getAllQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  activateQuestion,
  deactivateQuestion,
  bulkImportQuestions,
  exportQuestions,
  getQuestionStats,
} from "./questions";

export {
  // Reports
  getUserActivity,
  getContentPerformance,
  getFinancialReport,
  getEngagementMetrics,
  exportReport,
} from "./reports";

export {
  // VIP
  getVIPStats,
  getAllVIPUsers,
  getVIPUser,
  upgradeUserToVIP,
  downgradeVIPUser,
  getVIPRevenue,
  getVIPRetention,
} from "./vip";

export {
  // Notifications
  getNotificationHistory,
  createNotification,
  sendNotification,
  scheduleNotification,
  deleteNotification as deleteNotificationAdmin,
  getNotificationStats,
} from "./notifications";

export {
  // Settings
  getSystemSettings,
  updateSystemSettings,
  resetSettings,
  getPublicSettings,
} from "./settings";

export {
  // Shop items
  createShopItem,
  updateShopItem,
  deleteShopItem,
  getShopItemByIdAdmin,
  getAllShopItemsAdmin,
} from "./shop";

export {
  // Activity Logs
  getAllActivityLogs,
  getRecentLogs,
  getUserActivityLogs as getUserActivityLogsAdmin,
  getActivityStats,
  getSecurityEvents,
} from "./activityLogs";

// Import for wrapper function
import { getDashboardStats } from "./dashboard";

// Convenience wrapper - Match what admin pages are calling
export async function getAdminStats() {
  return getDashboardStats();
}
