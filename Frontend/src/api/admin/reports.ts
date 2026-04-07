// Admin Reports API

import { reports } from '@/data/mockDataAdmin';
import { simulateApiCall, createErrorResponse } from '../client';
import type { AdminApiResponse, PaginatedAdminResponse, ReportFilter, GenerateReportRequest } from './types';
import type { Report } from '@/data/mockDataAdmin';

/**
 * Get user activity data
 */
export async function getUserActivity(params: {
  days?: number;
  userId?: string;
}): Promise<
  AdminApiResponse<
    Array<{
      date: string;
      activeUsers: number;
      newUsers: number;
      sessions: number;
    }>
  >
> {
  const days = params.days || 7;
  const data = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      activeUsers: Math.floor(Math.random() * 3000) + 5000,
      newUsers: Math.floor(Math.random() * 100) + 50,
      sessions: Math.floor(Math.random() * 5000) + 10000,
    });
  }

  return simulateApiCall(data);
}

/**
 * Get content performance
 */
export async function getContentPerformance(params?: {
  unitId?: number;
  dateRange?: { start: string; end: string };
}): Promise<AdminApiResponse<any>> {
  return getContentPerformanceReportData(
    params?.dateRange || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    }
  );
}

/**
 * Get financial report
 */
export async function getFinancialReport(params?: {
  dateRange?: { start: string; end: string };
}): Promise<AdminApiResponse<any>> {
  return getFinancialReportData(
    params?.dateRange || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    }
  );
}

/**
 * Get engagement metrics
 */
export async function getEngagementMetrics(params?: {
  dateRange?: { start: string; end: string };
}): Promise<AdminApiResponse<any>> {
  return getEngagementReportData(
    params?.dateRange || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    }
  );
}

/**
 * Export report
 */
export async function exportReport(params: {
  reportId?: string;
  type: string;
  format: 'pdf' | 'csv' | 'xlsx';
}): Promise<AdminApiResponse<{ fileUrl: string; fileName: string }>> {
  if (params.reportId) {
    return downloadReport(params.reportId, params.format);
  }

  return simulateApiCall({
    fileUrl: `/exports/report-${Date.now()}.${params.format}`,
    fileName: `report-${params.type}-${new Date().toISOString().split('T')[0]}.${params.format}`,
  });
}

/**
 * Get all reports with pagination
 */
export async function getAllReports(
  filter?: ReportFilter,
  page: number = 1,
  pageSize: number = 20
): Promise<AdminApiResponse<PaginatedAdminResponse<Report>>> {
  let filteredReports = [...reports];

  // Apply filters
  if (filter?.type) {
    filteredReports = filteredReports.filter(r => r.type === filter.type);
  }
  if (filter?.status) {
    filteredReports = filteredReports.filter(r => r.status === filter.status);
  }
  if (filter?.dateFrom) {
    filteredReports = filteredReports.filter(
      r => new Date(r.generatedAt) >= new Date(filter.dateFrom!)
    );
  }
  if (filter?.dateTo) {
    filteredReports = filteredReports.filter(
      r => new Date(r.generatedAt) <= new Date(filter.dateTo!)
    );
  }

  // Pagination
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedData = filteredReports.slice(start, end);

  return simulateApiCall({
    data: paginatedData,
    total: filteredReports.length,
    page,
    pageSize,
    hasMore: end < filteredReports.length,
  });
}

/**
 * Get single report by ID
 */
export async function getReport(reportId: string): Promise<AdminApiResponse<Report>> {
  const report = reports.find(r => r.id === reportId);
  
  if (!report) {
    createErrorResponse('Report not found', 'NOT_FOUND');
  }

  return simulateApiCall(report);
}

/**
 * Generate new report
 */
export async function generateReport(data: GenerateReportRequest): Promise<AdminApiResponse<Report>> {
  // Validate
  if (!data.title || !data.dateRange.start || !data.dateRange.end) {
    createErrorResponse('Title and date range are required', 'VALIDATION_ERROR');
  }

  const newReport: Report = {
    id: `report-${Date.now()}`,
    type: data.type,
    title: data.title,
    description: data.description || '',
    dateRange: data.dateRange,
    generatedBy: 'admin-001',
    generatedAt: new Date().toISOString(),
    status: 'processing',
    summary: {
      totalRecords: 0,
      keyMetrics: {},
    },
  };

  // Simulate async processing
  setTimeout(() => {
    newReport.status = 'completed';
    newReport.fileUrl = `/reports/${newReport.id}.pdf`;
  }, 5000);

  return simulateApiCall(newReport, 2000);
}

/**
 * Download report
 */
export async function downloadReport(
  reportId: string,
  format: 'pdf' | 'csv' | 'xlsx' = 'pdf'
): Promise<
  AdminApiResponse<{
    fileUrl: string;
    fileName: string;
    fileSize: number;
  }>
> {
  const report = reports.find(r => r.id === reportId);
  
  if (!report) {
    createErrorResponse('Report not found', 'NOT_FOUND');
  }

  return simulateApiCall(
    {
      fileUrl: `/reports/${reportId}.${format}`,
      fileName: `${report.title.replace(/\s+/g, '-').toLowerCase()}.${format}`,
      fileSize: 1024000,
    },
    1500
  );
}

/**
 * Delete report
 */
export async function deleteReport(reportId: string): Promise<AdminApiResponse<boolean>> {
  const report = reports.find(r => r.id === reportId);
  
  if (!report) {
    createErrorResponse('Report not found', 'NOT_FOUND');
  }

  return simulateApiCall(true, 1000);
}

/**
 * Schedule report generation
 */
export async function scheduleReport(
  data: GenerateReportRequest & {
    frequency: 'daily' | 'weekly' | 'monthly';
    nextRun: string;
  }
): Promise<
  AdminApiResponse<{
    scheduleId: string;
    frequency: string;
    nextRun: string;
    enabled: boolean;
  }>
> {
  return simulateApiCall({
    scheduleId: `schedule-${Date.now()}`,
    frequency: data.frequency,
    nextRun: data.nextRun,
    enabled: true,
  });
}

/**
 * Get scheduled reports
 */
export async function getScheduledReports(): Promise<
  AdminApiResponse<
    Array<{
      scheduleId: string;
      reportType: string;
      frequency: 'daily' | 'weekly' | 'monthly';
      nextRun: string;
      lastRun?: string;
      enabled: boolean;
    }>
  >
> {
  return simulateApiCall([
    {
      scheduleId: 'schedule-001',
      reportType: 'user-progress',
      frequency: 'monthly',
      nextRun: '2026-05-01T00:00:00Z',
      lastRun: '2026-04-01T00:00:00Z',
      enabled: true,
    },
    {
      scheduleId: 'schedule-002',
      reportType: 'engagement',
      frequency: 'weekly',
      nextRun: '2026-04-14T00:00:00Z',
      lastRun: '2026-04-07T00:00:00Z',
      enabled: true,
    },
  ]);
}

/**
 * Get user progress report data
 */
export async function getUserProgressReportData(
  dateRange: { start: string; end: string }
): Promise<
  AdminApiResponse<{
    totalUsers: number;
    activeUsers: number;
    completedLessons: number;
    completedTests: number;
    averageScore: number;
    averageCompletionRate: number;
    topPerformers: Array<{
      userId: string;
      userName: string;
      lessonsCompleted: number;
      averageScore: number;
    }>;
    progressByUnit: Array<{
      unitId: number;
      unitName: string;
      enrollments: number;
      completions: number;
      completionRate: number;
    }>;
  }>
> {
  return simulateApiCall({
    totalUsers: 12171,
    activeUsers: 8234,
    completedLessons: 145678,
    completedTests: 28456,
    averageScore: 84.2,
    averageCompletionRate: 68.5,
    topPerformers: [
      {
        userId: 'user-101',
        userName: 'Emma Wilson',
        lessonsCompleted: 120,
        averageScore: 95.2,
      },
      {
        userId: 'user-102',
        userName: 'Liam Chen',
        lessonsCompleted: 98,
        averageScore: 93.8,
      },
    ],
    progressByUnit: [
      {
        unitId: 1,
        unitName: 'Family Life',
        enrollments: 8456,
        completions: 7821,
        completionRate: 92.5,
      },
      {
        unitId: 2,
        unitName: 'Healthy Living',
        enrollments: 6234,
        completions: 5318,
        completionRate: 85.3,
      },
    ],
  });
}

/**
 * Get content performance report data
 */
export async function getContentPerformanceReportData(
  dateRange: { start: string; end: string }
): Promise<
  AdminApiResponse<{
    totalContent: number;
    publishedContent: number;
    totalViews: number;
    averageRating: number;
    averageCompletionRate: number;
    topContent: Array<{
      contentId: string;
      title: string;
      type: string;
      views: number;
      rating: number;
      completionRate: number;
    }>;
    contentByType: Record<string, { count: number; avgRating: number }>;
  }>
> {
  return simulateApiCall({
    totalContent: 240,
    publishedContent: 210,
    totalViews: 234567,
    averageRating: 4.6,
    averageCompletionRate: 85.3,
    topContent: [
      {
        contentId: 'content-001',
        title: 'Family Life',
        type: 'unit',
        views: 8456,
        rating: 4.8,
        completionRate: 92.5,
      },
    ],
    contentByType: {
      unit: { count: 10, avgRating: 4.7 },
      lesson: { count: 120, avgRating: 4.6 },
      exercise: { count: 80, avgRating: 4.5 },
      test: { count: 30, avgRating: 4.8 },
    },
  });
}

/**
 * Get financial report data
 */
export async function getFinancialReportData(
  dateRange: { start: string; end: string }
): Promise<
  AdminApiResponse<{
    totalRevenue: number;
    subscriptionRevenue: number;
    otherRevenue: number;
    newSubscriptions: number;
    renewals: number;
    cancellations: number;
    churnRate: number;
    revenueByPlan: Record<string, number>;
    revenueOverTime: Array<{ date: string; amount: number }>;
  }>
> {
  return simulateApiCall({
    totalRevenue: 38200,
    subscriptionRevenue: 35000,
    otherRevenue: 3200,
    newSubscriptions: 287,
    renewals: 1000,
    cancellations: 32,
    churnRate: 3.2,
    revenueByPlan: {
      premium: 14350,
      elite: 20650,
    },
    revenueOverTime: [
      { date: '2026-03-01', amount: 1200 },
      { date: '2026-03-08', amount: 1450 },
      { date: '2026-03-15', amount: 1350 },
      { date: '2026-03-22', amount: 1580 },
      { date: '2026-03-29', amount: 1420 },
    ],
  });
}

/**
 * Get engagement report data
 */
export async function getEngagementReportData(
  dateRange: { start: string; end: string }
): Promise<
  AdminApiResponse<{
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    averageSessionTime: number;
    averageSessions: number;
    bounceRate: number;
    retentionRate: number;
    engagementByDay: Array<{ date: string; activeUsers: number; sessions: number }>;
  }>
> {
  return simulateApiCall({
    dailyActiveUsers: 8234,
    weeklyActiveUsers: 12450,
    monthlyActiveUsers: 18670,
    averageSessionTime: 42,
    averageSessions: 2.5,
    bounceRate: 12.3,
    retentionRate: 71.5,
    engagementByDay: [
      { date: '2026-04-01', activeUsers: 7850, sessions: 15670 },
      { date: '2026-04-02', activeUsers: 8120, sessions: 16240 },
      { date: '2026-04-03', activeUsers: 7940, sessions: 15880 },
      { date: '2026-04-04', activeUsers: 8350, sessions: 16700 },
      { date: '2026-04-05', activeUsers: 8090, sessions: 16180 },
      { date: '2026-04-06', activeUsers: 7680, sessions: 15360 },
      { date: '2026-04-07', activeUsers: 8234, sessions: 16468 },
    ],
  });
}

/**
 * Get system health report data
 */
export async function getSystemHealthReportData(
  dateRange: { start: string; end: string }
): Promise<
  AdminApiResponse<{
    uptime: number;
    averageResponseTime: number;
    errorRate: number;
    peakLoad: number;
    totalRequests: number;
    failedRequests: number;
    serverMetrics: Array<{
      timestamp: string;
      cpu: number;
      memory: number;
      responseTime: number;
    }>;
    errorsByType: Record<string, number>;
  }>
> {
  return simulateApiCall({
    uptime: 99.8,
    averageResponseTime: 145,
    errorRate: 0.2,
    peakLoad: 12450,
    totalRequests: 2456789,
    failedRequests: 4914,
    serverMetrics: [
      {
        timestamp: '2026-04-07T00:00:00Z',
        cpu: 45.2,
        memory: 62.8,
        responseTime: 142,
      },
    ],
    errorsByType: {
      '4xx': 3214,
      '5xx': 1700,
    },
  });
}