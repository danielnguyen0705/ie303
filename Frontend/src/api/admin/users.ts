import { createError, request } from "../utils/http";
import type { AdminApiResponse } from "./types";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: "USER" | "ADMIN" | string;
  status: "active" | "inactive";
  vipStatus: "free" | "premium";
  level: number;
  xp: number;
  coins: number;
  streak: number;
  joinedDate: string;
  lastActive: string;
}

export interface PaginatedAdminResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

type RawUser = {
  id: number | string;
  username?: string;
  name?: string;
  email?: string;
  role?: string;
  coin?: number;
  coins?: number;
  exp?: number;
  score?: number;
  streak?: number;
  vipExpiredAt?: string | null;
  createdAt?: string;
  lastStudyDate?: string | null;
};

type UserQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  searchTerm?: string;
  vipStatus?: "free" | "premium";
  role?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

function isVipActive(vipExpiredAt?: string | null): boolean {
  return Boolean(vipExpiredAt && new Date(vipExpiredAt).getTime() > Date.now());
}

function mapUser(user: RawUser): AdminUser {
  const name = user.username ?? user.name ?? "Unnamed user";
  const vipActive = isVipActive(user.vipExpiredAt);

  return {
    id: String(user.id),
    name,
    email: user.email ?? "",
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    role: user.role ?? "USER",
    status: "active",
    vipStatus: vipActive ? "premium" : "free",
    level: Math.max(1, Math.floor((user.exp ?? user.score ?? 0) / 300) + 1),
    xp: user.exp ?? user.score ?? 0,
    coins: user.coin ?? user.coins ?? 0,
    streak: user.streak ?? 0,
    joinedDate: user.createdAt ?? "",
    lastActive: user.lastStudyDate ?? user.createdAt ?? "",
  };
}

function applyClientFilters(users: AdminUser[], params?: UserQuery): AdminUser[] {
  let result = [...users];
  const term = (params?.searchTerm ?? params?.search ?? "").trim().toLowerCase();

  if (term) {
    result = result.filter(
      (user) =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term),
    );
  }

  if (params?.vipStatus) {
    result = result.filter((user) => user.vipStatus === params.vipStatus);
  }

  if (params?.role) {
    result = result.filter((user) => user.role === params.role);
  }

  if (params?.sortBy) {
    result.sort((a, b) => {
      const left = a[params.sortBy as keyof AdminUser];
      const right = b[params.sortBy as keyof AdminUser];
      const order = params.sortOrder === "desc" ? -1 : 1;

      if (typeof left === "number" && typeof right === "number") {
        return (left - right) * order;
      }

      return String(left ?? "").localeCompare(String(right ?? "")) * order;
    });
  }

  return result;
}

export async function getAllUsers(
  params?: UserQuery,
): Promise<AdminApiResponse<PaginatedAdminResponse<AdminUser>>> {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const response = await request<RawUser[]>("/users", { method: "GET" });

  if (!response.success || !response.data) {
    return response as AdminApiResponse<PaginatedAdminResponse<AdminUser>>;
  }

  const filteredUsers = applyClientFilters(response.data.map(mapUser), params);
  const start = (page - 1) * pageSize;
  const data = filteredUsers.slice(start, start + pageSize);

  return {
    success: true,
    data: {
      data,
      total: filteredUsers.length,
      page,
      pageSize,
      hasMore: start + pageSize < filteredUsers.length,
    },
  };
}

export async function getUser(userId: string): Promise<AdminApiResponse<AdminUser>> {
  if (!userId) {
    return createError("User id is required", "VALIDATION_ERROR");
  }

  const response = await request<RawUser>(`/users/${userId}`, { method: "GET" });

  if (!response.success || !response.data) {
    return response as AdminApiResponse<AdminUser>;
  }

  return {
    success: true,
    data: mapUser(response.data),
  };
}

export async function deleteUser(
  params: { userId: string } | string,
): Promise<AdminApiResponse<boolean>> {
  const userId = typeof params === "string" ? params : params.userId;

  if (!userId) {
    return createError("User id is required", "VALIDATION_ERROR");
  }

  const response = await request<string>(`/users/${userId}`, { method: "DELETE" });

  if (!response.success) {
    return response as AdminApiResponse<boolean>;
  }

  return { success: true, data: true };
}

export async function getUserStats(): Promise<
  AdminApiResponse<{
    total: number;
    active: number;
    vip: number;
    admins: number;
  }>
> {
  const response = await getAllUsers({ page: 1, pageSize: Number.MAX_SAFE_INTEGER });

  if (!response.success || !response.data) {
    return response as unknown as AdminApiResponse<{
      total: number;
      active: number;
      vip: number;
      admins: number;
    }>;
  }

  const users = response.data.data;

  return {
    success: true,
    data: {
      total: response.data.total,
      active: users.filter((user) => user.status === "active").length,
      vip: users.filter((user) => user.vipStatus !== "free").length,
      admins: users.filter((user) => user.role === "ADMIN").length,
    },
  };
}

export async function createUser(): Promise<AdminApiResponse<never>> {
  return createError("Admin user creation is not supported by the current backend contract", "UNSUPPORTED");
}

export async function updateUser(): Promise<AdminApiResponse<never>> {
  return createError("Admin user updates are not supported by the current backend contract", "UNSUPPORTED");
}

export async function suspendUser(): Promise<AdminApiResponse<never>> {
  return createError("User suspension is not supported by the current backend contract", "UNSUPPORTED");
}

export async function activateUser(): Promise<AdminApiResponse<never>> {
  return createError("User activation is not supported by the current backend contract", "UNSUPPORTED");
}

export async function getUserActivityLog(): Promise<AdminApiResponse<never>> {
  return createError("User activity logs are not supported by the current backend contract", "UNSUPPORTED");
}

export async function bulkUpdateUsers(): Promise<AdminApiResponse<never>> {
  return createError("Bulk user updates are not supported by the current backend contract", "UNSUPPORTED");
}

export async function bulkDeleteUsers(): Promise<AdminApiResponse<never>> {
  return createError("Bulk user deletion is not supported by the current backend contract", "UNSUPPORTED");
}

export async function exportUsers(): Promise<AdminApiResponse<never>> {
  return createError("User export is not supported by the current backend contract", "UNSUPPORTED");
}

export async function getUserLearningPath(): Promise<AdminApiResponse<never>> {
  return createError("User learning path is not supported by the current backend contract", "UNSUPPORTED");
}

export async function resetUserPassword(): Promise<AdminApiResponse<never>> {
  return createError("Password reset is not supported by the current backend contract", "UNSUPPORTED");
}

export async function assignVIPStatus(): Promise<AdminApiResponse<never>> {
  return createError("VIP assignment is handled through payment offers/transactions", "UNSUPPORTED");
}
