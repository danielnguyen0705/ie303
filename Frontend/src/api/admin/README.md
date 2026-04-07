# UIFIVE Admin API Documentation

## 📚 Overview

Admin API layer for UIFIVE management interfaces. All API calls are currently mocked with data from `/src/data/mockDataAdmin.ts` and include simulated network delays.

## 🏗️ Structure

```
src/api/admin/
├── index.ts              # Central exports
├── types.ts              # Admin-specific TypeScript types
├── dashboard.ts          # Dashboard & analytics
├── users.ts              # User management
├── content.ts            # Content management
├── questions.ts          # Question bank
├── reports.ts            # Reports generation
├── vip.ts                # VIP subscriptions
├── notifications.ts      # Notifications management
├── settings.ts           # System settings
└── activityLogs.ts       # Activity & security logs
```

## 🚀 Quick Start

### Import

```typescript
// Import all admin APIs
import * as adminApi from '@/api/admin';

// Or import specific modules
import { adminUserApi, adminContentApi, adminDashboardApi } from '@/api/admin';

// Or import individual functions
import { getAllUsers, createUser, getDashboardStats } from '@/api/admin';
```

### Usage Example

```typescript
import { getDashboardStats, getAllUsers, createContent } from '@/api/admin';

// Get dashboard stats
const stats = await getDashboardStats();
console.log('Total users:', stats.data.totalUsers);

// Get users with filters
const users = await getAllUsers({ role: 'student', status: 'active' });

// Create content
const newContent = await createContent({
  type: 'lesson',
  title: 'New Grammar Lesson',
  description: 'Advanced grammar topics',
  difficulty: 'advanced',
});
```

## 📖 API Modules

### 1. Dashboard (`dashboard.ts`)

**Functions:**
- `getDashboardStats()` - Get overview statistics
- `getAnalytics(period?)` - Get analytics data
- `getRealTimeStats()` - Get real-time metrics
- `getGrowthMetrics(period)` - Get growth trends
- `getKPISummary()` - Get KPI summary
- `getRecentActivities(limit?)` - Get recent activities
- `exportDashboardData(format)` - Export dashboard

**Example:**
```typescript
import { getDashboardStats, getAnalytics } from '@/api/admin';

// Get stats
const stats = await getDashboardStats();
console.log('Active users:', stats.data.activeUsers);
console.log('System health:', stats.data.systemHealth.status);

// Get analytics
const analytics = await getAnalytics('month');
console.log('User growth:', analytics.data.userGrowth);
```

---

### 2. User Management (`users.ts`)

**Functions:**
- `getAllUsers(filter?, page?, pageSize?)` - Get paginated users
- `getUser(userId)` - Get single user
- `createUser(data)` - Create new user
- `updateUser(userId, data)` - Update user
- `deleteUser(userId)` - Delete user
- `suspendUser(userId, reason)` - Suspend user
- `activateUser(userId)` - Activate user
- `getUserStats()` - Get user statistics
- `getUserActivityLog(userId, limit?)` - Get activity log
- `bulkUpdateUsers(userIds, updates)` - Bulk update
- `bulkDeleteUsers(userIds)` - Bulk delete
- `exportUsers(filter?, format?)` - Export users
- `resetUserPassword(userId)` - Reset password
- `assignVIPStatus(userId, vipStatus, duration)` - Assign VIP

**Example:**
```typescript
import { getAllUsers, createUser, suspendUser } from '@/api/admin';

// Get active students
const students = await getAllUsers(
  { role: 'student', status: 'active' },
  1,
  20
);

// Create new user
const newUser = await createUser({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'secure123',
  role: 'student',
});

// Suspend user
await suspendUser('user-123', 'Policy violation');
```

---

### 3. Content Management (`content.ts`)

**Functions:**
- `getAllContent(filter?, page?, pageSize?)` - Get paginated content
- `getContent(contentId)` - Get single content
- `getContentByUnitId(unitId)` - Get unit's content
- `createContent(data)` - Create new content
- `updateContent(contentId, data)` - Update content
- `deleteContent(contentId)` - Delete content
- `publishContent(contentId)` - Publish content
- `archiveContent(contentId)` - Archive content
- `getContentStats()` - Get statistics
- `getContentAnalytics(contentId)` - Get analytics
- `duplicateContent(contentId)` - Duplicate content
- `bulkPublishContent(contentIds)` - Bulk publish
- `bulkDeleteContent(contentIds)` - Bulk delete
- `exportContent(filter?, format?)` - Export content

**Example:**
```typescript
import { getAllContent, createContent, publishContent } from '@/api/admin';

// Get draft content
const drafts = await getAllContent({ status: 'draft' });

// Create lesson
const lesson = await createContent({
  type: 'lesson',
  title: 'Past Perfect Tense',
  description: 'Learn past perfect grammar',
  unitId: 2,
  lessonType: 'grammar',
  difficulty: 'intermediate',
});

// Publish
await publishContent(lesson.data.id);
```

---

### 4. Question Bank (`questions.ts`)

**Functions:**
- `getAllQuestions(filter?, page?, pageSize?)` - Get paginated questions
- `getQuestion(questionId)` - Get single question
- `getQuestionsByCategoryApi(category)` - Filter by category
- `getQuestionsByDifficultyApi(difficulty)` - Filter by difficulty
- `createQuestion(data)` - Create new question
- `updateQuestion(questionId, data)` - Update question
- `deleteQuestion(questionId)` - Delete question
- `activateQuestion(questionId)` - Activate question
- `deactivateQuestion(questionId)` - Deactivate question
- `flagQuestionForReview(questionId, reason)` - Flag for review
- `getQuestionStats()` - Get statistics
- `getQuestionAnalytics(questionId)` - Get analytics
- `duplicateQuestion(questionId)` - Duplicate question
- `bulkDeleteQuestions(questionIds)` - Bulk delete
- `bulkUpdateQuestionStatus(questionIds, status)` - Bulk update
- `importQuestions(file, format)` - Import from file
- `exportQuestions(filter?, format?)` - Export questions
- `getAllTags()` - Get all unique tags

**Example:**
```typescript
import { getAllQuestions, createQuestion, getQuestionAnalytics } from '@/api/admin';

// Get grammar questions
const grammarQuestions = await getAllQuestions({ category: 'grammar' });

// Create question
const question = await createQuestion({
  type: 'multiple-choice',
  category: 'grammar',
  difficulty: 'easy',
  question: 'She _____ to school every day.',
  options: ['go', 'goes', 'going', 'gone'],
  correctAnswer: 'goes',
  explanation: 'Use "goes" with third person singular in present simple.',
  points: 10,
  tags: ['present-simple', 'verb-forms'],
  unitId: 1,
});

// Get analytics
const analytics = await getQuestionAnalytics('q-admin-001');
console.log('Success rate:', analytics.data.successRate + '%');
```

---

### 5. Reports (`reports.ts`)

**Functions:**
- `getAllReports(filter?, page?, pageSize?)` - Get paginated reports
- `getReport(reportId)` - Get single report
- `generateReport(data)` - Generate new report
- `downloadReport(reportId, format?)` - Download report
- `deleteReport(reportId)` - Delete report
- `scheduleReport(data)` - Schedule automatic report
- `getScheduledReports()` - Get scheduled reports
- `getUserProgressReportData(dateRange)` - User progress data
- `getContentPerformanceReportData(dateRange)` - Content data
- `getFinancialReportData(dateRange)` - Financial data
- `getEngagementReportData(dateRange)` - Engagement data
- `getSystemHealthReportData(dateRange)` - System health data

**Example:**
```typescript
import { generateReport, getReport, downloadReport } from '@/api/admin';

// Generate report
const report = await generateReport({
  type: 'user-progress',
  title: 'Monthly Progress Report',
  description: 'User learning progress for April',
  dateRange: {
    start: '2026-04-01',
    end: '2026-04-30',
  },
});

// Download report
const file = await downloadReport(report.data.id, 'pdf');
console.log('Download URL:', file.data.fileUrl);
```

---

### 6. VIP Management (`vip.ts`)

**Functions:**
- `getAllVIPSubscriptions(filter?, page?, pageSize?)` - Get paginated VIPs
- `getVIPSubscription(vipId)` - Get single subscription
- `getVIPByUser(userId)` - Get user's subscription
- `getActiveVIPs()` - Get active subscriptions
- `createVIPSubscription(data)` - Create subscription
- `updateVIPSubscription(vipId, data)` - Update subscription
- `cancelVIPSubscription(vipId, reason?)` - Cancel subscription
- `renewVIPSubscription(vipId, duration)` - Renew subscription
- `extendVIPSubscription(vipId, days)` - Extend subscription
- `getVIPStats()` - Get statistics
- `getVIPRevenue(period)` - Get revenue breakdown
- `getExpiringSubscriptions(daysAhead?)` - Get expiring soon
- `sendRenewalReminder(vipId)` - Send reminder
- `processAutoRenewals()` - Process auto-renewals
- `exportVIPData(filter?, format?)` - Export data

**Example:**
```typescript
import { createVIPSubscription, getVIPStats, getExpiringSubscriptions } from '@/api/admin';

// Create VIP subscription
const vip = await createVIPSubscription({
  userId: 'user-123',
  plan: 'premium',
  duration: 12, // months
  amount: 500,
  paymentMethod: 'credit-card',
  autoRenew: true,
});

// Get stats
const stats = await getVIPStats();
console.log('Active VIPs:', stats.data.active);
console.log('MRR:', stats.data.mrr);

// Get expiring in 30 days
const expiring = await getExpiringSubscriptions(30);
```

---

### 7. Notifications (`notifications.ts`)

**Functions:**
- `getAllNotifications(filter?, page?, pageSize?)` - Get paginated
- `getNotification(notificationId)` - Get single notification
- `getScheduled()` - Get scheduled notifications
- `getSent()` - Get sent notifications
- `createNotification(data)` - Create notification
- `updateNotification(notificationId, data)` - Update notification
- `deleteNotification(notificationId)` - Delete notification
- `sendNotification(notificationId)` - Send immediately
- `scheduleNotification(notificationId, scheduledFor)` - Schedule
- `cancelScheduledNotification(notificationId)` - Cancel scheduled
- `duplicateNotification(notificationId)` - Duplicate notification
- `getNotificationStats()` - Get statistics
- `getNotificationAnalytics(notificationId)` - Get analytics
- `testNotification(notificationId)` - Test send
- `bulkSendNotifications(notificationIds)` - Bulk send
- `bulkDeleteNotifications(notificationIds)` - Bulk delete

**Example:**
```typescript
import { createNotification, sendNotification } from '@/api/admin';

// Create notification
const notif = await createNotification({
  type: 'announcement',
  priority: 'high',
  title: 'New Features Released!',
  message: 'Check out our latest updates...',
  targetAudience: 'all',
});

// Send immediately
await sendNotification(notif.data.id);

// Or schedule for later
await scheduleNotification(notif.data.id, '2026-04-10T09:00:00Z');
```

---

### 8. Settings (`settings.ts`)

**Functions:**
- `getAllSettings(filter?)` - Get all settings
- `getSettingsByCategoryApi(category)` - Filter by category
- `getSetting(key)` - Get single setting
- `getSettingValueApi(key)` - Get setting value
- `updateSetting(key, data)` - Update setting
- `bulkUpdateSettings(updates)` - Bulk update
- `resetSetting(key)` - Reset to default
- `resetCategorySettings(category)` - Reset category
- `getSettingsHistory(key, limit?)` - Get change history
- `exportSettings(format?)` - Export settings
- `importSettings(file, format)` - Import settings
- `validateSettingValue(key, value)` - Validate value
- `getPublicSettings()` - Get public settings
- `testEmailSettings()` - Test email config
- `clearSettingsCache()` - Clear cache

**Example:**
```typescript
import { getAllSettings, updateSetting, testEmailSettings } from '@/api/admin';

// Get all settings
const settings = await getAllSettings();

// Update setting
await updateSetting('maintenance_mode', { value: false });

// Test email
const emailTest = await testEmailSettings();
console.log('Email working:', emailTest.data.success);
```

---

### 9. Activity Logs (`activityLogs.ts`)

**Functions:**
- `getAllActivityLogs(filter?, page?, pageSize?)` - Get paginated logs
- `getRecentLogs(limit?)` - Get recent logs
- `getActivityLog(logId)` - Get single log
- `getUserActivityLogs(userId, limit?)` - Get user's logs
- `getLogsByAction(action, limit?)` - Filter by action
- `getFailedLogs(limit?)` - Get failed actions
- `getActivityStats(dateRange?)` - Get statistics
- `getLoginActivity(dateRange?)` - Get login stats
- `deleteOldLogs(olderThan)` - Delete old logs
- `exportActivityLogs(filter?, format?)` - Export logs
- `getSecurityEvents(limit?)` - Get security events
- `searchActivityLogs(searchTerm, limit?)` - Search logs

**Example:**
```typescript
import { getRecentLogs, getActivityStats, getSecurityEvents } from '@/api/admin';

// Get recent activity
const recent = await getRecentLogs(20);

// Get statistics
const stats = await getActivityStats({
  start: '2026-04-01',
  end: '2026-04-07',
});
console.log('Success rate:', stats.data.successRate + '%');

// Get security events
const security = await getSecurityEvents(10);
```

---

## 🔧 Response Types

### Admin API Response

```typescript
interface AdminApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}
```

### Paginated Response

```typescript
interface PaginatedAdminResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
```

## 🎯 Common Patterns

### Pagination

```typescript
// Get page 2 with 20 items per page
const result = await getAllUsers(undefined, 2, 20);

console.log('Page:', result.data.page);
console.log('Total:', result.data.total);
console.log('Has more:', result.data.hasMore);
```

### Filtering

```typescript
// Filter users
const students = await getAllUsers({
  role: 'student',
  status: 'active',
  vipStatus: 'premium',
  searchTerm: 'john',
});

// Filter content
const lessons = await getAllContent({
  type: 'lesson',
  status: 'published',
  difficulty: 'intermediate',
  unitId: 2,
});

// Filter questions
const questions = await getAllQuestions({
  category: 'grammar',
  difficulty: 'easy',
  status: 'active',
  tags: ['present-simple'],
});
```

### Error Handling

```typescript
try {
  const user = await createUser({
    name: 'John',
    email: 'john@example.com',
    password: 'pass123',
    role: 'student',
  });
  console.log('Created:', user.data);
} catch (error) {
  console.error('Error:', error.message);
  console.error('Code:', error.code);
}
```

### Bulk Operations

```typescript
// Bulk delete users
const result = await bulkDeleteUsers(['user-1', 'user-2', 'user-3']);
console.log('Deleted:', result.data.deleted);
console.log('Failed:', result.data.failed);

// Bulk update settings
await bulkUpdateSettings([
  { key: 'maintenance_mode', value: false },
  { key: 'max_login_attempts', value: 5 },
]);
```

## 📊 Statistics & Analytics

Most modules provide stats and analytics:

```typescript
// User stats
const userStats = await getUserStats();

// Content stats
const contentStats = await getContentStats();

// Question stats
const questionStats = await getQuestionStats();

// VIP stats
const vipStats = await getVIPStats();

// Activity stats
const activityStats = await getActivityStats();
```

## 📁 Export Functionality

Most modules support exporting:

```typescript
// Export users
const file = await exportUsers(
  { role: 'student' },
  'csv' // or 'json', 'xlsx'
);

// Export content
await exportContent({ status: 'published' }, 'json');

// Export questions
await exportQuestions({ category: 'grammar' }, 'xlsx');

// Export VIP data
await exportVIPData({ plan: 'premium' }, 'csv');
```

## 🔄 Migration to Real API

When connecting to a real backend:

1. Update base URL in config
2. Add authentication headers
3. Replace `simulateApiCall` with real HTTP calls
4. Update error handling
5. Types remain the same!

```typescript
// Future implementation
async function getAllUsers(filter, page, pageSize) {
  const response = await fetch(`${API_BASE_URL}/admin/users`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    // ... query params
  });
  return response.json();
}
```

## 📚 Related Documentation

- `/src/data/mockDataAdmin.ts` - Admin mock data source
- `/MOCKDATA_ADMIN_GUIDE.md` - Admin data guide
- `/ADMIN_GUIDE.md` - Admin interface guide
- `/src/api/README.md` - User API documentation

---

**Last Updated:** April 7, 2026  
**Version:** 1.0.0
