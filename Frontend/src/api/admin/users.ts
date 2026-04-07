// Admin User Management API

import { adminUsers, getUserStatsSummary, getAdminUserById } from '@/data/mockDataAdmin';
import { simulateApiCall, createErrorResponse } from '../client';
import type { AdminApiResponse, PaginatedAdminResponse, UserFilter, CreateUserRequest, UpdateUserRequest } from './types';
import type { AdminUser } from '@/data/mockDataAdmin';

/**
 * Get all users with pagination
 */
export async function getAllUsers(
  params?: {
    filter?: UserFilter;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    vipStatus?: 'free' | 'premium' | 'elite';
    role?: string;
    status?: string;
    searchTerm?: string;
  }
): Promise<AdminApiResponse<PaginatedAdminResponse<AdminUser>>> {
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 20;
  let filteredUsers = [...adminUsers];

  // Apply filters from params or from filter object
  const filter = params?.filter || params;
  
  if (filter?.role) {
    filteredUsers = filteredUsers.filter(u => u.role === filter.role);
  }
  if (filter?.status) {
    filteredUsers = filteredUsers.filter(u => u.status === filter.status);
  }
  if (filter?.vipStatus || params?.vipStatus) {
    const vipStatus = filter?.vipStatus || params?.vipStatus;
    filteredUsers = filteredUsers.filter(u => u.vipStatus === vipStatus);
  }
  if (filter?.searchTerm || params?.searchTerm) {
    const term = (filter?.searchTerm || params?.searchTerm || '').toLowerCase();
    filteredUsers = filteredUsers.filter(
      u =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
    );
  }

  // Apply sorting
  if (params?.sortBy) {
    filteredUsers.sort((a, b) => {
      const aVal = a[params.sortBy as keyof AdminUser];
      const bVal = b[params.sortBy as keyof AdminUser];
      const order = params.sortOrder === 'desc' ? -1 : 1;
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * order;
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * order;
      }
      return 0;
    });
  }

  // Pagination
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedData = filteredUsers.slice(start, end);

  return simulateApiCall({
    data: paginatedData,
    total: filteredUsers.length,
    page,
    pageSize,
    hasMore: end < filteredUsers.length,
  });
}

/**
 * Get single user by ID
 */
export async function getUser(userId: string): Promise<AdminApiResponse<AdminUser>> {
  const user = getAdminUserById(userId);
  
  if (!user) {
    createErrorResponse('User not found', 'NOT_FOUND');
  }

  return simulateApiCall(user);
}

/**
 * Create new user
 */
export async function createUser(data: CreateUserRequest): Promise<AdminApiResponse<AdminUser>> {
  // Validate
  if (!data.email || !data.password || !data.name) {
    createErrorResponse('All fields are required', 'VALIDATION_ERROR');
  }

  const newUser: AdminUser = {
    id: `user-${Date.now()}`,
    name: data.name,
    email: data.email,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.name}`,
    role: data.role,
    status: 'active',
    vipStatus: 'free',
    level: 1,
    xp: 0,
    coins: 0,
    streak: 0,
    accuracy: 0,
    joinedDate: new Date().toISOString().split('T')[0],
    lastActive: new Date().toISOString(),
    totalLessonsCompleted: 0,
    totalTestsTaken: 0,
    averageScore: 0,
  };

  return simulateApiCall(newUser);
}

/**
 * Update user
 */
export async function updateUser(
  userId: string,
  data: UpdateUserRequest
): Promise<AdminApiResponse<AdminUser>> {
  const user = getAdminUserById(userId);
  
  if (!user) {
    createErrorResponse('User not found', 'NOT_FOUND');
  }

  const updatedUser: AdminUser = {
    ...user,
    ...data,
  };

  return simulateApiCall(updatedUser);
}

/**
 * Delete user
 */
export async function deleteUser(params: { userId: string } | string): Promise<AdminApiResponse<boolean>> {
  // Support both param object and direct string for backward compatibility
  const userId = typeof params === 'string' ? params : params.userId;
  const user = getAdminUserById(userId);
  
  if (!user) {
    createErrorResponse('User not found', 'NOT_FOUND');
  }

  return simulateApiCall(true, 1000);
}

/**
 * Suspend user
 */
export async function suspendUser(
  userId: string,
  reason: string
): Promise<AdminApiResponse<AdminUser>> {
  const user = getAdminUserById(userId);
  
  if (!user) {
    createErrorResponse('User not found', 'NOT_FOUND');
  }

  const suspendedUser: AdminUser = {
    ...user,
    status: 'suspended',
  };

  return simulateApiCall(suspendedUser);
}

/**
 * Activate user
 */
export async function activateUser(userId: string): Promise<AdminApiResponse<AdminUser>> {
  const user = getAdminUserById(userId);
  
  if (!user) {
    createErrorResponse('User not found', 'NOT_FOUND');
  }

  const activatedUser: AdminUser = {
    ...user,
    status: 'active',
  };

  return simulateApiCall(activatedUser);
}

/**
 * Get user statistics summary
 */
export async function getUserStats(): Promise<
  AdminApiResponse<ReturnType<typeof getUserStatsSummary>>
> {
  const stats = getUserStatsSummary();
  return simulateApiCall(stats);
}

/**
 * Get user activity log
 */
export async function getUserActivityLog(
  userId: string,
  limit: number = 50
): Promise<
  AdminApiResponse<
    Array<{
      id: string;
      action: string;
      timestamp: string;
      details: string;
    }>
  >
> {
  return simulateApiCall([
    {
      id: 'log-001',
      action: 'Completed lesson',
      timestamp: '2026-04-07T14:30:00Z',
      details: 'Lesson: Present Simple, Score: 92%',
    },
    {
      id: 'log-002',
      action: 'Took test',
      timestamp: '2026-04-06T16:20:00Z',
      details: 'Test: Unit 1 Final, Score: 96%',
    },
  ].slice(0, limit));
}

/**
 * Bulk update users
 */
export async function bulkUpdateUsers(
  userIds: string[],
  updates: UpdateUserRequest
): Promise<
  AdminApiResponse<{
    updated: number;
    failed: number;
    errors: Array<{ userId: string; error: string }>;
  }>
> {
  return simulateApiCall(
    {
      updated: userIds.length,
      failed: 0,
      errors: [],
    },
    1500
  );
}

/**
 * Bulk delete users
 */
export async function bulkDeleteUsers(
  userIds: string[]
): Promise<
  AdminApiResponse<{
    deleted: number;
    failed: number;
    errors: Array<{ userId: string; error: string }>;
  }>
> {
  return simulateApiCall(
    {
      deleted: userIds.length,
      failed: 0,
      errors: [],
    },
    2000
  );
}

/**
 * Export users
 */
export async function exportUsers(
  filter?: UserFilter,
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
      fileUrl: `/exports/users-${Date.now()}.${format}`,
      fileName: `users-export-${new Date().toISOString().split('T')[0]}.${format}`,
      totalRecords: adminUsers.length,
    },
    2000
  );
}

/**
 * Get user learning path
 */
export async function getUserLearningPath(userId: string): Promise<
  AdminApiResponse<{
    completedUnits: number[];
    currentUnits: number[];
    recommendedNext: number[];
    strengths: string[];
    weaknesses: string[];
  }>
> {
  return simulateApiCall({
    completedUnits: [1, 2],
    currentUnits: [3],
    recommendedNext: [4],
    strengths: ['Grammar', 'Vocabulary'],
    weaknesses: ['Listening', 'Speaking'],
  });
}

/**
 * Reset user password
 */
export async function resetUserPassword(
  userId: string
): Promise<
  AdminApiResponse<{
    temporaryPassword: string;
    expiresAt: string;
  }>
> {
  return simulateApiCall({
    temporaryPassword: 'Temp123!@#',
    expiresAt: new Date(Date.now() + 86400000).toISOString(), // 24 hours
  });
}

/**
 * Assign VIP status
 */
export async function assignVIPStatus(
  userId: string,
  vipStatus: 'premium' | 'elite',
  duration: number // months
): Promise<AdminApiResponse<AdminUser>> {
  const user = getAdminUserById(userId);
  
  if (!user) {
    createErrorResponse('User not found', 'NOT_FOUND');
  }

  const updatedUser: AdminUser = {
    ...user,
    vipStatus,
  };

  return simulateApiCall(updatedUser);
}