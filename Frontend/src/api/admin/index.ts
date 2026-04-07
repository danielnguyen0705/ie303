// Admin API Index - Central exports for all admin API modules

// Types
export * from './types';

// Dashboard API
export * as adminDashboardApi from './dashboard';

// User Management API
export * as adminUserApi from './users';

// Content Management API
export * as adminContentApi from './content';

// Question Bank API
export * as adminQuestionApi from './questions';

// Reports API
export * as adminReportApi from './reports';

// VIP Management API
export * as adminVIPApi from './vip';

// Notifications API
export * as adminNotificationApi from './notifications';

// Settings API
export * as adminSettingsApi from './settings';

// Activity Logs API
export * as adminActivityApi from './activityLogs';

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
} from './dashboard';

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
} from './users';

export {
  // Content
  getAllUnits as getAllUnitsAdmin,
  getUnit as getUnitAdmin,
  createUnit,
  updateUnit,
  deleteUnit,
  getLessonsByUnit as getLessonsByUnitAdmin,
  getLesson as getLessonAdmin,
  createLesson,
  updateLesson,
  deleteLesson,
  publishLesson,
  archiveLesson,
  reorderLessons,
  // Also export without Admin suffix for convenience
  getAllUnits,
  getUnit,
  getLessonsByUnit,
  getLesson,
} from './content';

export {
  // Questions
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
} from './questions';

export {
  // Reports
  getUserActivity,
  getContentPerformance,
  getFinancialReport,
  getEngagementMetrics,
  exportReport,
} from './reports';

export {
  // VIP
  getVIPStats,
  getAllVIPUsers,
  getVIPUser,
  upgradeUserToVIP,
  downgradeVIPUser,
  getVIPRevenue,
  getVIPRetention,
} from './vip';

export {
  // Notifications
  getNotificationHistory,
  createNotification,
  sendNotification,
  scheduleNotification,
  deleteNotification as deleteNotificationAdmin,
  getNotificationStats,
} from './notifications';

export {
  // Settings
  getSystemSettings,
  updateSystemSettings,
  resetSettings,
  getPublicSettings,
} from './settings';

export {
  // Activity Logs
  getAllActivityLogs,
  getRecentLogs,
  getUserActivityLogs as getUserActivityLogsAdmin,
  getActivityStats,
  getSecurityEvents,
} from './activityLogs';

// Import for wrapper function
import { getDashboardStats } from './dashboard';

// Convenience wrapper - Match what admin pages are calling
export async function getAdminStats() {
  return getDashboardStats();
}