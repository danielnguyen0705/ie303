import { request } from "../utils/http";
import type { AdminApiResponse, Grade, Lesson, Question, Unit } from "./types";

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  totalLessons: number;
  totalUnits: number;
  totalQuestions: number;
  totalTests: number;
  averageCompletionRate: number;
  averageAccuracy: number;
  totalRevenue: number;
  revenueThisMonth: number;
  vipSubscriptions: {
    premium: number;
    elite: number;
    total: number;
  };
  systemHealth: {
    status: "healthy" | "warning" | "critical";
    uptime: number;
    responseTime: number;
    errorRate: number;
  };
}

export interface Analytics {
  period: "today" | "week" | "month" | "year";
  userGrowth: Array<{ date: string; count: number }>;
  engagement: Array<{ date: string; activeUsers: number; totalSessions: number }>;
  revenue: Array<{ date: string; amount: number }>;
  topUnits: Array<{ unitId: number; title: string; completions: number; rating: number }>;
  topQuestions: Array<{ questionId: string; question: string; attempts: number; successRate: number }>;
  deviceBreakdown: { desktop: number; mobile: number; tablet: number };
  browserBreakdown: Record<string, number>;
}

type RawUser = {
  id: number | string;
  vipExpiredAt?: string | null;
  createdAt?: string;
  lastStudyDate?: string | null;
};

type PaymentTransaction = {
  amount?: number;
  status?: string;
  createdAt?: string;
};

function isSameMonth(date?: string): boolean {
  if (!date) return false;
  const parsed = new Date(date);
  const now = new Date();
  return parsed.getMonth() === now.getMonth() && parsed.getFullYear() === now.getFullYear();
}

function isVipActive(user: RawUser): boolean {
  return Boolean(user.vipExpiredAt && new Date(user.vipExpiredAt).getTime() > Date.now());
}

export async function getDashboardStats(): Promise<AdminApiResponse<DashboardStats>> {
  const [usersRes, gradesRes, unitsRes, lessonsRes, questionsRes, paymentsRes] =
    await Promise.all([
      request<RawUser[]>("/users", { method: "GET" }),
      request<Grade[]>("/grades", { method: "GET" }),
      request<Unit[]>("/units", { method: "GET" }),
      request<Lesson[]>("/lessons", { method: "GET" }),
      request<Question[]>("/questions", { method: "GET" }),
      request<PaymentTransaction[]>("/payments/transactions", { method: "GET" }),
    ]);

  const firstError = [usersRes, gradesRes, unitsRes, lessonsRes, questionsRes].find(
    (response) => !response.success,
  );

  if (firstError) {
    return firstError as AdminApiResponse<DashboardStats>;
  }

  const users = usersRes.data ?? [];
  const payments = paymentsRes.success ? paymentsRes.data ?? [] : [];
  const completedPayments = payments.filter(
    (payment) => payment.status === "SUCCESS" || payment.status === "COMPLETED",
  );
  const vipUsers = users.filter(isVipActive).length;

  return {
    success: true,
    data: {
      totalUsers: users.length,
      activeUsers: users.filter((user) => Boolean(user.lastStudyDate)).length,
      newUsersToday: 0,
      newUsersThisWeek: 0,
      newUsersThisMonth: users.filter((user) => isSameMonth(user.createdAt)).length,
      totalLessons: lessonsRes.data?.length ?? 0,
      totalUnits: unitsRes.data?.length ?? 0,
      totalQuestions: questionsRes.data?.length ?? 0,
      totalTests: 0,
      averageCompletionRate: 0,
      averageAccuracy: 0,
      totalRevenue: completedPayments.reduce((sum, payment) => sum + (payment.amount ?? 0), 0),
      revenueThisMonth: completedPayments
        .filter((payment) => isSameMonth(payment.createdAt))
        .reduce((sum, payment) => sum + (payment.amount ?? 0), 0),
      vipSubscriptions: {
        premium: vipUsers,
        elite: 0,
        total: vipUsers,
      },
      systemHealth: {
        status: "healthy",
        uptime: 100,
        responseTime: 0,
        errorRate: 0,
      },
    },
  };
}

export async function getAnalytics(
  period: "today" | "week" | "month" | "year" = "month",
): Promise<AdminApiResponse<Analytics>> {
  return {
    success: true,
    data: {
      period,
      userGrowth: [],
      engagement: [],
      revenue: [],
      topUnits: [],
      topQuestions: [],
      deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 },
      browserBreakdown: {},
    },
  };
}

export async function getUserActivity(params: {
  days?: number;
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
  const days = params.days ?? 7;
  const usersRes = await request<RawUser[]>("/users", { method: "GET" });

  if (!usersRes.success || !usersRes.data) {
    return usersRes as AdminApiResponse<
      Array<{ date: string; activeUsers: number; newUsers: number; sessions: number }>
    >;
  }

  const users = usersRes.data;
  const data = Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - index));
    const day = date.toISOString().slice(0, 10);

    return {
      date: day,
      activeUsers: users.filter((user) => user.lastStudyDate === day).length,
      newUsers: users.filter((user) => user.createdAt?.startsWith(day)).length,
      sessions: 0,
    };
  });

  return { success: true, data };
}

export async function getRealTimeStats(): Promise<
  AdminApiResponse<{
    onlineUsers: number;
    activeTests: number;
    activeExercises: number;
    recentSignups: number;
    serverLoad: number;
    avgResponseTime: number;
  }>
> {
  return {
    success: true,
    data: {
      onlineUsers: 0,
      activeTests: 0,
      activeExercises: 0,
      recentSignups: 0,
      serverLoad: 0,
      avgResponseTime: 0,
    },
  };
}

export async function getGrowthMetrics(): Promise<
  AdminApiResponse<{
    userGrowth: number;
    revenueGrowth: number;
    engagementGrowth: number;
    completionRateGrowth: number;
    trend: "up" | "down" | "stable";
  }>
> {
  return {
    success: true,
    data: {
      userGrowth: 0,
      revenueGrowth: 0,
      engagementGrowth: 0,
      completionRateGrowth: 0,
      trend: "stable",
    },
  };
}

export async function getKPISummary(): Promise<AdminApiResponse<Record<string, never>>> {
  return { success: true, data: {} };
}

export async function getRecentActivities(): Promise<
  AdminApiResponse<
    Array<{
      id: string;
      type: "user" | "content" | "system";
      message: string;
      timestamp: string;
      severity: "info" | "warning" | "error";
    }>
  >
> {
  return { success: true, data: [] };
}

export async function exportDashboardData(): Promise<AdminApiResponse<never>> {
  return {
    success: false,
    error: {
      name: "ApiError",
      code: "UNSUPPORTED",
      message: "Dashboard export is not supported by the current backend contract",
    },
  };
}
