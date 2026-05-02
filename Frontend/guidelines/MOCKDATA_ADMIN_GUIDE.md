# Admin Mock Data Guide - UIFIVE

## 📦 Overview

File `/src/data/mockDataAdmin.ts` chứa tất cả dữ liệu mẫu cần thiết cho giao diện admin của UIFIVE.

---

## 📋 Contents

### 1. **Types & Interfaces**

Định nghĩa TypeScript cho tất cả admin entities:

```typescript
- AdminUser
- ContentItem
- AdminQuestion
- Report
- VIPSubscription
- Notification
- SystemSettings
- DashboardStats
- ActivityLog
- Analytics
```

### 2. **Data Collections**

| Collection | Count | Description |
|------------|-------|-------------|
| `dashboardStats` | 1 | KPIs và system health metrics |
| `analytics` | 1 | Charts data (user growth, engagement, revenue) |
| `adminUsers` | 9 | Users with roles (student, teacher, admin) |
| `contentItems` | 8 | Units, lessons, exercises, tests |
| `adminQuestions` | 8 | Question bank with usage stats |
| `reports` | 5 | Generated reports (progress, performance, financial) |
| `vipSubscriptions` | 6 | Premium & Elite subscriptions |
| `notifications` | 6 | System notifications & announcements |
| `systemSettings` | 15 | Configuration settings |
| `activityLogs` | 7 | Admin action logs |

---

## 🎯 Usage Examples

### Import Data

```typescript
import { 
  dashboardStats,
  adminUsers,
  contentItems,
  analytics,
  getAdminUserById 
} from '@/data/mockDataAdmin';
```

---

## 📊 Admin Dashboard

### Dashboard Stats
```typescript
import { dashboardStats, analytics } from '@/data/mockDataAdmin';

function AdminDashboard() {
  return (
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard 
          title="Total Users" 
          value={dashboardStats.totalUsers}
          trend="+12.5%"
        />
        <StatCard 
          title="Active Users" 
          value={dashboardStats.activeUsers}
          trend="+8.3%"
        />
        <StatCard 
          title="Revenue This Month" 
          value={`$${dashboardStats.revenueThisMonth.toLocaleString()}`}
          trend="+15.2%"
        />
        <StatCard 
          title="VIP Subscribers" 
          value={dashboardStats.vipSubscriptions.total}
          trend="+5.7%"
        />
      </div>

      {/* User Growth Chart */}
      <LineChart data={analytics.userGrowth} />

      {/* Engagement Chart */}
      <BarChart data={analytics.engagement} />

      {/* System Health */}
      <div className={`status-${dashboardStats.systemHealth.status}`}>
        <div>Uptime: {dashboardStats.systemHealth.uptime}%</div>
        <div>Response Time: {dashboardStats.systemHealth.responseTime}ms</div>
        <div>Error Rate: {dashboardStats.systemHealth.errorRate}%</div>
      </div>
    </div>
  );
}
```

### Analytics Charts
```typescript
import { analytics } from '@/data/mockDataAdmin';

function AnalyticsCharts() {
  return (
    <div>
      {/* User Growth */}
      <LineChart 
        data={analytics.userGrowth.map(d => ({
          date: d.date,
          users: d.count
        }))}
      />

      {/* Daily Engagement */}
      <AreaChart 
        data={analytics.engagement.map(d => ({
          date: d.date,
          active: d.activeUsers,
          sessions: d.totalSessions
        }))}
      />

      {/* Device Breakdown */}
      <PieChart data={[
        { name: 'Desktop', value: analytics.deviceBreakdown.desktop },
        { name: 'Mobile', value: analytics.deviceBreakdown.mobile },
        { name: 'Tablet', value: analytics.deviceBreakdown.tablet },
      ]} />

      {/* Top Units */}
      <BarChart 
        data={analytics.topUnits.map(u => ({
          name: u.title,
          completions: u.completions,
          rating: u.rating
        }))}
      />
    </div>
  );
}
```

---

## 👥 User Management

### User List
```typescript
import { adminUsers, getUserStatsSummary } from '@/data/mockDataAdmin';

function UserManagement() {
  const stats = getUserStatsSummary();
  
  // Filter users
  const activeStudents = adminUsers.filter(
    u => u.role === 'student' && u.status === 'active'
  );
  
  const vipUsers = adminUsers.filter(
    u => u.vipStatus === 'premium' || u.vipStatus === 'elite'
  );

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats.total} />
        <StatCard title="Active" value={stats.active} />
        <StatCard title="Students" value={stats.students} />
        <StatCard title="Teachers" value={stats.teachers} />
      </div>

      {/* User Table */}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>VIP</th>
            <th>Level</th>
            <th>Last Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {adminUsers.map(user => (
            <tr key={user.id}>
              <td>
                <div className="flex items-center gap-2">
                  <img src={user.avatar} className="w-8 h-8 rounded-full" />
                  <span>{user.name}</span>
                </div>
              </td>
              <td>{user.email}</td>
              <td>
                <Badge variant={user.role}>{user.role}</Badge>
              </td>
              <td>
                <Badge variant={user.status}>{user.status}</Badge>
              </td>
              <td>
                <Badge variant={user.vipStatus}>{user.vipStatus}</Badge>
              </td>
              <td>{user.level}</td>
              <td>{formatDate(user.lastActive)}</td>
              <td>
                <button>Edit</button>
                <button>Suspend</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### User Details
```typescript
import { getAdminUserById } from '@/data/mockDataAdmin';

function UserDetails({ userId }: { userId: string }) {
  const user = getAdminUserById(userId);
  
  if (!user) return <div>User not found</div>;

  return (
    <div>
      {/* Profile Header */}
      <div className="flex items-center gap-4">
        <img src={user.avatar} className="w-20 h-20 rounded-full" />
        <div>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <Badge>{user.role}</Badge>
          <Badge>{user.vipStatus}</Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Level" value={user.level} />
        <StatCard title="XP" value={user.xp} />
        <StatCard title="Coins" value={user.coins} />
        <StatCard title="Streak" value={`${user.streak} days`} />
        <StatCard title="Accuracy" value={`${user.accuracy}%`} />
        <StatCard title="Lessons" value={user.totalLessonsCompleted} />
      </div>

      {/* Learning Progress */}
      <div>
        <h3>Learning Progress</h3>
        <div>Tests Taken: {user.totalTestsTaken}</div>
        <div>Average Score: {user.averageScore}%</div>
        <div>Joined: {formatDate(user.joinedDate)}</div>
        <div>Last Active: {formatDate(user.lastActive)}</div>
      </div>
    </div>
  );
}
```

---

## 📚 Content Management

### Content List
```typescript
import { contentItems, getContentStatsSummary } from '@/data/mockDataAdmin';

function ContentManagement() {
  const stats = getContentStatsSummary();
  
  // Filter by status
  const publishedContent = contentItems.filter(c => c.status === 'published');
  const draftContent = contentItems.filter(c => c.status === 'draft');

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Total Content" value={stats.total} />
        <StatCard title="Published" value={stats.published} />
        <StatCard title="Drafts" value={stats.draft} />
        <StatCard title="Under Review" value={stats.underReview} />
      </div>

      {/* Tabs */}
      <Tabs>
        <Tab title="All">
          <ContentTable items={contentItems} />
        </Tab>
        <Tab title="Units">
          <ContentTable items={contentItems.filter(c => c.type === 'unit')} />
        </Tab>
        <Tab title="Lessons">
          <ContentTable items={contentItems.filter(c => c.type === 'lesson')} />
        </Tab>
        <Tab title="Exercises">
          <ContentTable items={contentItems.filter(c => c.type === 'exercise')} />
        </Tab>
      </Tabs>
    </div>
  );
}
```

### Content Table
```typescript
function ContentTable({ items }: { items: ContentItem[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Type</th>
          <th>Status</th>
          <th>Author</th>
          <th>Views</th>
          <th>Completion</th>
          <th>Rating</th>
          <th>Updated</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map(item => (
          <tr key={item.id}>
            <td>{item.title}</td>
            <td><Badge>{item.type}</Badge></td>
            <td><Badge variant={item.status}>{item.status}</Badge></td>
            <td>{item.author}</td>
            <td>{item.views.toLocaleString()}</td>
            <td>{item.completionRate}%</td>
            <td>⭐ {item.averageRating} ({item.totalRatings})</td>
            <td>{formatDate(item.updatedAt)}</td>
            <td>
              <button>Edit</button>
              <button>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## ❓ Question Bank

### Question List
```typescript
import { 
  adminQuestions, 
  getQuestionsByCategory,
  getQuestionStatsSummary 
} from '@/data/mockDataAdmin';

function QuestionBank() {
  const stats = getQuestionStatsSummary();
  
  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard title="Total" value={stats.total} />
        <StatCard title="Grammar" value={stats.grammar} />
        <StatCard title="Vocabulary" value={stats.vocabulary} />
        <StatCard title="Reading" value={stats.reading} />
        <StatCard title="Listening" value={stats.listening} />
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select onChange={(e) => filterByCategory(e.target.value)}>
          <option value="all">All Categories</option>
          <option value="grammar">Grammar</option>
          <option value="vocabulary">Vocabulary</option>
          <option value="reading">Reading</option>
          <option value="listening">Listening</option>
        </select>
        
        <select onChange={(e) => filterByDifficulty(e.target.value)}>
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* Question Table */}
      <table>
        <thead>
          <tr>
            <th>Question</th>
            <th>Type</th>
            <th>Category</th>
            <th>Difficulty</th>
            <th>Usage</th>
            <th>Success Rate</th>
            <th>Avg Time</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {adminQuestions.map(q => (
            <tr key={q.id}>
              <td className="max-w-xs truncate">{q.question}</td>
              <td><Badge>{q.type}</Badge></td>
              <td><Badge>{q.category}</Badge></td>
              <td><Badge variant={q.difficulty}>{q.difficulty}</Badge></td>
              <td>{q.usageCount}</td>
              <td>{q.successRate}%</td>
              <td>{q.averageTime}s</td>
              <td><Badge variant={q.status}>{q.status}</Badge></td>
              <td>
                <button>Edit</button>
                <button>Duplicate</button>
                <button>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Question Analytics
```typescript
function QuestionAnalytics({ questionId }: { questionId: string }) {
  const question = getQuestionById(questionId);
  
  return (
    <div>
      <h3>{question?.question}</h3>
      
      <div className="grid grid-cols-4 gap-4">
        <StatCard 
          title="Total Attempts" 
          value={question?.usageCount}
        />
        <StatCard 
          title="Success Rate" 
          value={`${question?.successRate}%`}
          color={question?.successRate > 80 ? 'green' : 'yellow'}
        />
        <StatCard 
          title="Average Time" 
          value={`${question?.averageTime}s`}
        />
        <StatCard 
          title="Points" 
          value={question?.points}
        />
      </div>

      {/* Tags */}
      <div className="flex gap-2">
        {question?.tags.map(tag => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </div>
    </div>
  );
}
```

---

## 📊 Reports

### Report List
```typescript
import { reports } from '@/data/mockDataAdmin';

function Reports() {
  const completedReports = reports.filter(r => r.status === 'completed');
  const processingReports = reports.filter(r => r.status === 'processing');

  return (
    <div>
      {/* Generate Report Button */}
      <button onClick={generateNewReport}>
        Generate New Report
      </button>

      {/* Report Cards */}
      <div className="grid grid-cols-3 gap-4">
        {reports.map(report => (
          <div key={report.id} className="report-card">
            <div className="flex items-center justify-between">
              <Badge>{report.type}</Badge>
              <Badge variant={report.status}>{report.status}</Badge>
            </div>
            
            <h3>{report.title}</h3>
            <p>{report.description}</p>
            
            <div className="date-range">
              {formatDate(report.dateRange.start)} - {formatDate(report.dateRange.end)}
            </div>

            <div className="key-metrics">
              {Object.entries(report.summary.keyMetrics).map(([key, value]) => (
                <div key={key}>
                  <span className="label">{key}:</span>
                  <span className="value">{value}</span>
                </div>
              ))}
            </div>

            {report.fileUrl && (
              <a href={report.fileUrl} download>
                Download Report
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Generate Report
```typescript
function GenerateReportModal() {
  const [reportType, setReportType] = useState('user-progress');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const handleGenerate = () => {
    // Create new report
    const newReport: Report = {
      id: `report-${Date.now()}`,
      type: reportType,
      title: `${reportType} Report`,
      description: 'Auto-generated report',
      dateRange,
      generatedBy: 'admin-001',
      generatedAt: new Date().toISOString(),
      status: 'processing',
      summary: {
        totalRecords: 0,
        keyMetrics: {},
      },
    };
    
    // Add to reports array
  };

  return (
    <Modal>
      <h2>Generate Report</h2>
      
      <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
        <option value="user-progress">User Progress</option>
        <option value="content-performance">Content Performance</option>
        <option value="financial">Financial</option>
        <option value="engagement">Engagement</option>
        <option value="system">System Health</option>
      </select>

      <DateRangePicker 
        value={dateRange} 
        onChange={setDateRange} 
      />

      <button onClick={handleGenerate}>Generate</button>
    </Modal>
  );
}
```

---

## 👑 VIP Management

### VIP Subscriptions
```typescript
import { vipSubscriptions, getActiveVipSubscriptions } from '@/data/mockDataAdmin';

function VIPManagement() {
  const activeVips = getActiveVipSubscriptions();
  const premiumSubs = vipSubscriptions.filter(v => v.plan === 'premium');
  const eliteSubs = vipSubscriptions.filter(v => v.plan === 'elite');

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Active VIPs" value={activeVips.length} />
        <StatCard title="Premium" value={premiumSubs.length} />
        <StatCard title="Elite" value={eliteSubs.length} />
        <StatCard 
          title="Monthly Revenue" 
          value={`$${calculateRevenue(activeVips)}`}
        />
      </div>

      {/* Subscription Table */}
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Plan</th>
            <th>Status</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Amount</th>
            <th>Auto Renew</th>
            <th>Next Billing</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vipSubscriptions.map(vip => (
            <tr key={vip.id}>
              <td>
                <div className="flex items-center gap-2">
                  <img src={vip.userAvatar} className="w-8 h-8 rounded-full" />
                  <div>
                    <div>{vip.userName}</div>
                    <div className="text-sm text-gray-500">{vip.userEmail}</div>
                  </div>
                </div>
              </td>
              <td>
                <Badge variant={vip.plan}>{vip.plan}</Badge>
              </td>
              <td>
                <Badge variant={vip.status}>{vip.status}</Badge>
              </td>
              <td>{formatDate(vip.startDate)}</td>
              <td>{formatDate(vip.endDate)}</td>
              <td>${vip.amount}</td>
              <td>{vip.autoRenew ? '✓' : '✗'}</td>
              <td>{vip.nextBillingDate ? formatDate(vip.nextBillingDate) : '-'}</td>
              <td>
                <button>Extend</button>
                <button>Cancel</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 🔔 Notifications

### Notification Manager
```typescript
import { 
  notifications, 
  getScheduledNotifications,
  getSentNotifications 
} from '@/data/mockDataAdmin';

function Notifications() {
  const scheduled = getScheduledNotifications();
  const sent = getSentNotifications();
  const drafts = notifications.filter(n => n.status === 'draft');

  return (
    <div>
      {/* Create New Button */}
      <button onClick={createNotification}>
        Create Notification
      </button>

      {/* Tabs */}
      <Tabs>
        <Tab title={`Scheduled (${scheduled.length})`}>
          <NotificationList items={scheduled} />
        </Tab>
        <Tab title={`Sent (${sent.length})`}>
          <NotificationList items={sent} />
        </Tab>
        <Tab title={`Drafts (${drafts.length})`}>
          <NotificationList items={drafts} />
        </Tab>
      </Tabs>
    </div>
  );
}
```

### Notification Card
```typescript
function NotificationCard({ notification }: { notification: Notification }) {
  return (
    <div className="notification-card">
      <div className="flex items-center justify-between">
        <Badge variant={notification.type}>{notification.type}</Badge>
        <Badge variant={notification.priority}>{notification.priority}</Badge>
        <Badge variant={notification.status}>{notification.status}</Badge>
      </div>

      <h3>{notification.title}</h3>
      <p>{notification.message}</p>

      <div className="metadata">
        <div>Target: {notification.targetAudience}</div>
        <div>Recipients: {notification.totalRecipients}</div>
        {notification.readCount > 0 && (
          <div>Read: {notification.readCount} ({Math.round(notification.readCount / notification.totalRecipients * 100)}%)</div>
        )}
        {notification.clickRate && (
          <div>Click Rate: {notification.clickRate}%</div>
        )}
      </div>

      <div className="dates">
        <div>Created: {formatDate(notification.createdAt)}</div>
        {notification.scheduledFor && (
          <div>Scheduled: {formatDate(notification.scheduledFor)}</div>
        )}
        {notification.sentAt && (
          <div>Sent: {formatDate(notification.sentAt)}</div>
        )}
      </div>

      <div className="actions">
        <button>Edit</button>
        <button>Duplicate</button>
        <button>Delete</button>
      </div>
    </div>
  );
}
```

---

## ⚙️ Settings

### System Settings
```typescript
import { systemSettings, getSettingsByCategory } from '@/data/mockDataAdmin';

function Settings() {
  const generalSettings = getSettingsByCategory('general');
  const securitySettings = getSettingsByCategory('security');
  const emailSettings = getSettingsByCategory('email');
  const gamificationSettings = getSettingsByCategory('gamification');

  return (
    <div>
      <Tabs>
        <Tab title="General">
          <SettingsSection settings={generalSettings} />
        </Tab>
        <Tab title="Security">
          <SettingsSection settings={securitySettings} />
        </Tab>
        <Tab title="Email">
          <SettingsSection settings={emailSettings} />
        </Tab>
        <Tab title="Payment">
          <SettingsSection settings={getSettingsByCategory('payment')} />
        </Tab>
        <Tab title="Gamification">
          <SettingsSection settings={gamificationSettings} />
        </Tab>
        <Tab title="API">
          <SettingsSection settings={getSettingsByCategory('api')} />
        </Tab>
      </Tabs>
    </div>
  );
}
```

### Settings Form
```typescript
function SettingsSection({ settings }: { settings: SystemSettings[] }) {
  return (
    <form>
      {settings.map(setting => (
        <div key={setting.id} className="setting-item">
          <label htmlFor={setting.key}>
            {setting.displayName}
            {!setting.isPublic && <Badge>Private</Badge>}
          </label>
          <p className="description">{setting.description}</p>
          
          {setting.dataType === 'boolean' ? (
            <input 
              type="checkbox" 
              id={setting.key}
              defaultChecked={setting.value as boolean}
            />
          ) : setting.dataType === 'number' ? (
            <input 
              type="number" 
              id={setting.key}
              defaultValue={setting.value as number}
            />
          ) : (
            <input 
              type="text" 
              id={setting.key}
              defaultValue={setting.value as string}
            />
          )}

          <div className="meta text-sm text-gray-500">
            Last modified: {formatDate(setting.lastModified)} by {setting.modifiedBy}
          </div>
        </div>
      ))}

      <button type="submit">Save Changes</button>
    </form>
  );
}
```

---

## 📜 Activity Logs

### Activity Log Viewer
```typescript
import { activityLogs, getRecentActivityLogs } from '@/data/mockDataAdmin';

function ActivityLogs() {
  const recentLogs = getRecentActivityLogs(50);

  return (
    <div>
      <h2>Activity Logs</h2>

      {/* Filters */}
      <div className="flex gap-4">
        <input type="text" placeholder="Search..." />
        <select>
          <option value="all">All Actions</option>
          <option value="login">Login</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
        </select>
        <DateRangePicker />
      </div>

      {/* Log Table */}
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>User</th>
            <th>Action</th>
            <th>Target</th>
            <th>Status</th>
            <th>IP Address</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {recentLogs.map(log => (
            <tr key={log.id}>
              <td>{formatDateTime(log.timestamp)}</td>
              <td>{log.userName}</td>
              <td><Badge>{log.action}</Badge></td>
              <td>{log.target}</td>
              <td>
                <Badge variant={log.status}>{log.status}</Badge>
              </td>
              <td>{log.ipAddress}</td>
              <td>{log.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 🔧 Helper Functions Reference

### User Helpers
```typescript
getAdminUserById(userId: string): AdminUser | undefined
getUserStatsSummary(): { total, active, students, teachers, ... }
```

### Content Helpers
```typescript
getContentById(contentId: string): ContentItem | undefined
getContentByUnit(unitId: number): ContentItem[]
getContentStatsSummary(): { total, published, draft, ... }
```

### Question Helpers
```typescript
getQuestionById(questionId: string): AdminQuestion | undefined
getQuestionsByCategory(category: string): AdminQuestion[]
getQuestionsByDifficulty(difficulty: string): AdminQuestion[]
getQuestionStatsSummary(): { total, active, grammar, ... }
```

### VIP Helpers
```typescript
getActiveVipSubscriptions(): VIPSubscription[]
getVipByUserId(userId: string): VIPSubscription | undefined
calculateRevenue(subscriptions: VIPSubscription[]): number
```

### Notification Helpers
```typescript
getScheduledNotifications(): Notification[]
getSentNotifications(): Notification[]
```

### Settings Helpers
```typescript
getSettingsByCategory(category: string): SystemSettings[]
getSettingValue(key: string): string | number | boolean | undefined
```

### Activity Helpers
```typescript
getRecentActivityLogs(limit: number = 10): ActivityLog[]
```

---

## 📊 Data Statistics

```
Total Collections: 10
Total Records:
  - Users: 9 (6 students, 1 teacher, 2 admins)
  - Content: 8 items
  - Questions: 8 questions
  - Reports: 5 reports
  - VIP Subscriptions: 6
  - Notifications: 6
  - Settings: 15
  - Activity Logs: 7
```

---

## 🎯 Best Practices

1. **Always use helper functions**
   ```typescript
   // Good ✅
   const user = getAdminUserById('user-001');
   
   // Avoid ❌
   const user = adminUsers.find(u => u.id === 'user-001');
   ```

2. **Type your variables**
   ```typescript
   const user: AdminUser | undefined = getAdminUserById('user-001');
   ```

3. **Use summary functions for stats**
   ```typescript
   const stats = getUserStatsSummary();
   const contentStats = getContentStatsSummary();
   ```

4. **Filter data efficiently**
   ```typescript
   const activeUsers = adminUsers.filter(u => u.status === 'active');
   const premiumVips = vipSubscriptions.filter(v => v.plan === 'premium');
   ```

---

## 📖 Related Files

- `/src/data/mockDataAdmin.ts` - Main admin data file
- `/src/data/mockData.ts` - User data file
- `/ADMIN_GUIDE.md` - Admin interface guide
- `/ROUTES_SUMMARY.md` - Routes reference

---

**Last Updated:** April 7, 2026  
**Version:** 1.0.0
