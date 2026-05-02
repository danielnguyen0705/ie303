// Admin Activity Logs API

import { activityLogs, getRecentActivityLogs } from '@/data/mockDataAdmin';
import { simulateApiCall, createErrorResponse } from '../client';
import type { AdminApiResponse, PaginatedAdminResponse, ActivityLogFilter } from './types';
import type { ActivityLog } from '@/data/mockDataAdmin';

/**
 * Get all activity logs with pagination
 */
export async function getAllActivityLogs(
  filter?: ActivityLogFilter,
  page: number = 1,
  pageSize: number = 50
): Promise<AdminApiResponse<PaginatedAdminResponse<ActivityLog>>> {
  let filteredLogs = [...activityLogs];

  // Apply filters
  if (filter?.userId) {
    filteredLogs = filteredLogs.filter(log => log.userId === filter.userId);
  }
  if (filter?.action) {
    filteredLogs = filteredLogs.filter(log => 
      log.action.toLowerCase().includes(filter.action!.toLowerCase())
    );
  }
  if (filter?.status) {
    filteredLogs = filteredLogs.filter(log => log.status === filter.status);
  }
  if (filter?.dateFrom) {
    filteredLogs = filteredLogs.filter(
      log => new Date(log.timestamp) >= new Date(filter.dateFrom!)
    );
  }
  if (filter?.dateTo) {
    filteredLogs = filteredLogs.filter(
      log => new Date(log.timestamp) <= new Date(filter.dateTo!)
    );
  }

  // Sort by timestamp (newest first)
  filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Pagination
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedData = filteredLogs.slice(start, end);

  return simulateApiCall({
    data: paginatedData,
    total: filteredLogs.length,
    page,
    pageSize,
    hasMore: end < filteredLogs.length,
  });
}

/**
 * Get recent activity logs
 */
export async function getRecentLogs(limit: number = 50): Promise<AdminApiResponse<ActivityLog[]>> {
  const recent = getRecentActivityLogs(limit);
  return simulateApiCall(recent);
}

/**
 * Get single activity log
 */
export async function getActivityLog(logId: string): Promise<AdminApiResponse<ActivityLog>> {
  const log = activityLogs.find(l => l.id === logId);
  
  if (!log) {
    return createErrorResponse('Activity log not found', 'NOT_FOUND');
  }

  return simulateApiCall(log);
}

/**
 * Get user activity logs
 */
export async function getUserActivityLogs(
  userId: string,
  limit: number = 50
): Promise<AdminApiResponse<ActivityLog[]>> {
  const userLogs = activityLogs
    .filter(log => log.userId === userId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);

  return simulateApiCall(userLogs);
}

/**
 * Get activity logs by action
 */
export async function getLogsByAction(
  action: string,
  limit: number = 50
): Promise<AdminApiResponse<ActivityLog[]>> {
  const actionLogs = activityLogs
    .filter(log => log.action.toLowerCase().includes(action.toLowerCase()))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);

  return simulateApiCall(actionLogs);
}

/**
 * Get failed activity logs
 */
export async function getFailedLogs(limit: number = 50): Promise<AdminApiResponse<ActivityLog[]>> {
  const failedLogs = activityLogs
    .filter(log => log.status === 'failed')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);

  return simulateApiCall(failedLogs);
}

/**
 * Get activity statistics
 */
export async function getActivityStats(
  dateRange?: { start: string; end: string }
): Promise<
  AdminApiResponse<{
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    warningActions: number;
    successRate: number;
    uniqueUsers: number;
    topActions: Array<{ action: string; count: number }>;
    topUsers: Array<{ userId: string; userName: string; actionCount: number }>;
    actionsByDay: Array<{ date: string; count: number }>;
    actionsByHour: Array<{ hour: number; count: number }>;
  }>
> {
  return simulateApiCall({
    totalActions: 15678,
    successfulActions: 15234,
    failedActions: 344,
    warningActions: 100,
    successRate: 97.2,
    uniqueUsers: 245,
    topActions: [
      { action: 'Updated content', count: 3456 },
      { action: 'Created user', count: 2345 },
      { action: 'Published content', count: 1234 },
      { action: 'Generated report', count: 890 },
      { action: 'Updated setting', count: 567 },
    ],
    topUsers: [
      { userId: 'admin-001', userName: 'Michael Anderson', actionCount: 8234 },
      { userId: 'teacher-001', userName: 'Dr. Sarah Johnson', actionCount: 4567 },
    ],
    actionsByDay: [
      { date: '2026-04-01', count: 2234 },
      { date: '2026-04-02', count: 2345 },
      { date: '2026-04-03', count: 2156 },
      { date: '2026-04-04', count: 2567 },
      { date: '2026-04-05', count: 2234 },
      { date: '2026-04-06', count: 1987 },
      { date: '2026-04-07', count: 2155 },
    ],
    actionsByHour: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: Math.floor(Math.random() * 500) + 100,
    })),
  });
}

/**
 * Get login activity
 */
export async function getLoginActivity(
  dateRange?: { start: string; end: string }
): Promise<
  AdminApiResponse<{
    totalLogins: number;
    successfulLogins: number;
    failedLogins: number;
    uniqueUsers: number;
    loginsByDay: Array<{ date: string; successful: number; failed: number }>;
    topLocations: Array<{ location: string; count: number }>;
    topDevices: Array<{ device: string; count: number }>;
  }>
> {
  return simulateApiCall({
    totalLogins: 45678,
    successfulLogins: 44567,
    failedLogins: 1111,
    uniqueUsers: 8234,
    loginsByDay: [
      { date: '2026-04-01', successful: 6432, failed: 145 },
      { date: '2026-04-02', successful: 6543, failed: 167 },
      { date: '2026-04-03', successful: 6321, failed: 134 },
      { date: '2026-04-04', successful: 6678, failed: 189 },
      { date: '2026-04-05', successful: 6456, failed: 156 },
      { date: '2026-04-06', successful: 6123, failed: 143 },
      { date: '2026-04-07', successful: 6014, failed: 177 },
    ],
    topLocations: [
      { location: 'United States', count: 15234 },
      { location: 'United Kingdom', count: 8456 },
      { location: 'Vietnam', count: 6789 },
      { location: 'India', count: 4567 },
      { location: 'Australia', count: 2345 },
    ],
    topDevices: [
      { device: 'Desktop - Windows', count: 18234 },
      { device: 'Mobile - iOS', count: 12456 },
      { device: 'Mobile - Android', count: 9876 },
      { device: 'Desktop - Mac', count: 3456 },
      { device: 'Tablet - iPad', count: 1656 },
    ],
  });
}

/**
 * Delete old activity logs
 */
export async function deleteOldLogs(
  olderThan: number // days
): Promise<
  AdminApiResponse<{
    deleted: number;
    message: string;
  }>
> {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - olderThan);

  const toDelete = activityLogs.filter(
    log => new Date(log.timestamp) < threshold
  );

  return simulateApiCall(
    {
      deleted: toDelete.length,
      message: `Deleted ${toDelete.length} activity logs older than ${olderThan} days`,
    },
    2000
  );
}

/**
 * Export activity logs
 */
export async function exportActivityLogs(
  filter?: ActivityLogFilter,
  format: 'csv' | 'json' | 'xlsx' = 'csv'
): Promise<
  AdminApiResponse<{
    fileUrl: string;
    fileName: string;
    totalRecords: number;
  }>
> {
  return simulateApiCall(
    {
      fileUrl: `/exports/activity-logs-${Date.now()}.${format}`,
      fileName: `activity-logs-${new Date().toISOString().split('T')[0]}.${format}`,
      totalRecords: activityLogs.length,
    },
    2000
  );
}

/**
 * Get security events
 */
export async function getSecurityEvents(
  limit: number = 50
): Promise<
  AdminApiResponse<
    Array<{
      id: string;
      type: 'failed-login' | 'suspicious-activity' | 'unauthorized-access' | 'data-breach-attempt';
      severity: 'low' | 'medium' | 'high' | 'critical';
      userId?: string;
      userName?: string;
      ipAddress: string;
      timestamp: string;
      details: string;
      resolved: boolean;
    }>
  >
> {
  return simulateApiCall([
    {
      id: 'sec-001',
      type: 'failed-login',
      severity: 'medium',
      userId: 'user-123',
      userName: 'John Doe',
      ipAddress: '203.0.113.42',
      timestamp: '2026-04-07T08:15:00Z',
      details: 'Multiple failed login attempts (5) within 10 minutes',
      resolved: false,
    },
    {
      id: 'sec-002',
      type: 'suspicious-activity',
      severity: 'high',
      ipAddress: '198.51.100.25',
      timestamp: '2026-04-07T03:30:00Z',
      details: 'API rate limit exceeded by 300%',
      resolved: true,
    },
  ].slice(0, limit));
}

/**
 * Search activity logs
 */
export async function searchActivityLogs(
  searchTerm: string,
  limit: number = 50
): Promise<AdminApiResponse<ActivityLog[]>> {
  const term = searchTerm.toLowerCase();
  const results = activityLogs
    .filter(log =>
      log.action.toLowerCase().includes(term) ||
      log.userName.toLowerCase().includes(term) ||
      log.target.toLowerCase().includes(term) ||
      (log.details && log.details.toLowerCase().includes(term))
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);

  return simulateApiCall(results);
}
