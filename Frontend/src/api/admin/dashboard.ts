// Admin Dashboard API

import { dashboardStats, analytics } from '@/data/mockDataAdmin';
import { simulateApiCall } from '../client';
import type { AdminApiResponse } from './types';
import type { DashboardStats, Analytics } from '@/data/mockDataAdmin';

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<AdminApiResponse<DashboardStats>> {
  return simulateApiCall(dashboardStats);
}

/**
 * Get analytics data
 */
export async function getAnalytics(
  period?: 'today' | 'week' | 'month' | 'year'
): Promise<AdminApiResponse<Analytics>> {
  return simulateApiCall({
    ...analytics,
    period: period || 'month',
  });
}

/**
 * Get real-time statistics
 */
export async function getRealTimeStats(): Promise<
  AdminApiResponse<{
    onlineUsers: number;
    activeTests: number;
    activeExercises: number;
    recentSignups: number;
    serverLoad: number; // percentage
    avgResponseTime: number; // ms
  }>
> {
  return simulateApiCall({
    onlineUsers: 1234,
    activeTests: 45,
    activeExercises: 123,
    recentSignups: 8,
    serverLoad: 45.8,
    avgResponseTime: 145,
  });
}

/**
 * Get growth metrics
 */
export async function getGrowthMetrics(
  period: 'week' | 'month' | 'quarter' | 'year'
): Promise<
  AdminApiResponse<{
    userGrowth: number; // percentage
    revenueGrowth: number;
    engagementGrowth: number;
    completionRateGrowth: number;
    trend: 'up' | 'down' | 'stable';
  }>
> {
  return simulateApiCall({
    userGrowth: 12.5,
    revenueGrowth: 15.2,
    engagementGrowth: 8.3,
    completionRateGrowth: 5.7,
    trend: 'up',
  });
}

/**
 * Get KPI summary
 */
export async function getKPISummary(): Promise<
  AdminApiResponse<{
    retention: {
      daily: number;
      weekly: number;
      monthly: number;
    };
    engagement: {
      avgSessionTime: number; // minutes
      avgDailyUsers: number;
      avgTestsPerUser: number;
    };
    revenue: {
      mrr: number; // Monthly Recurring Revenue
      arr: number; // Annual Recurring Revenue
      churnRate: number;
      ltv: number; // Lifetime Value
    };
    content: {
      avgCompletionRate: number;
      avgRating: number;
      totalViews: number;
    };
  }>
> {
  return simulateApiCall({
    retention: {
      daily: 45.2,
      weekly: 62.8,
      monthly: 71.5,
    },
    engagement: {
      avgSessionTime: 42,
      avgDailyUsers: 8234,
      avgTestsPerUser: 2.5,
    },
    revenue: {
      mrr: 34500,
      arr: 414000,
      churnRate: 3.2,
      ltv: 1250,
    },
    content: {
      avgCompletionRate: 68.5,
      avgRating: 4.6,
      totalViews: 234567,
    },
  });
}

/**
 * Get recent activities
 */
export async function getRecentActivities(limit: number = 10): Promise<
  AdminApiResponse<
    Array<{
      id: string;
      type: 'user' | 'content' | 'system';
      message: string;
      timestamp: string;
      severity: 'info' | 'warning' | 'error';
    }>
  >
> {
  return simulateApiCall([
    {
      id: 'act-001',
      type: 'user',
      message: '45 new users registered today',
      timestamp: '2026-04-07T16:00:00Z',
      severity: 'info',
    },
    {
      id: 'act-002',
      type: 'content',
      message: 'Unit 6 published successfully',
      timestamp: '2026-04-07T15:30:00Z',
      severity: 'info',
    },
    {
      id: 'act-003',
      type: 'system',
      message: 'Database backup completed',
      timestamp: '2026-04-07T14:00:00Z',
      severity: 'info',
    },
  ].slice(0, limit));
}

/**
 * Export dashboard data
 */
export async function exportDashboardData(
  format: 'csv' | 'json' | 'pdf'
): Promise<
  AdminApiResponse<{
    fileUrl: string;
    fileName: string;
    fileSize: number; // bytes
  }>
> {
  return simulateApiCall(
    {
      fileUrl: `/exports/dashboard-${Date.now()}.${format}`,
      fileName: `dashboard-report-${new Date().toISOString().split('T')[0]}.${format}`,
      fileSize: 1024000,
    },
    1500
  );
}
