// Admin VIP Management API

import { vipSubscriptions, getActiveVipSubscriptions, getVipByUserId, calculateRevenue, getVipStatsSummary } from '@/data/mockDataAdmin';
import { simulateApiCall, createErrorResponse } from '../client';
import type { AdminApiResponse, PaginatedAdminResponse, VIPFilter, CreateVIPSubscriptionRequest, UpdateVIPSubscriptionRequest } from './types';
import type { VIPSubscription } from '@/data/mockDataAdmin';

/**
 * Get all VIP subscriptions with pagination
 */
export async function getAllVIPSubscriptions(
  filter?: VIPFilter,
  page: number = 1,
  pageSize: number = 20
): Promise<AdminApiResponse<PaginatedAdminResponse<VIPSubscription>>> {
  let filteredVIPs = [...vipSubscriptions];

  // Apply filters
  if (filter?.plan) {
    filteredVIPs = filteredVIPs.filter(v => v.plan === filter.plan);
  }
  if (filter?.status) {
    filteredVIPs = filteredVIPs.filter(v => v.status === filter.status);
  }

  // Pagination
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedData = filteredVIPs.slice(start, end);

  return simulateApiCall({
    data: paginatedData,
    total: filteredVIPs.length,
    page,
    pageSize,
    hasMore: end < filteredVIPs.length,
  });
}

/**
 * Get single VIP subscription by ID
 */
export async function getVIPSubscription(vipId: string): Promise<AdminApiResponse<VIPSubscription>> {
  const vip = vipSubscriptions.find(v => v.id === vipId);
  
  if (!vip) {
    createErrorResponse('VIP subscription not found', 'NOT_FOUND');
  }

  return simulateApiCall(vip);
}

/**
 * Get VIP subscription by user ID
 */
export async function getVIPByUser(userId: string): Promise<AdminApiResponse<VIPSubscription | null>> {
  const vip = getVipByUserId(userId);
  return simulateApiCall(vip || null);
}

/**
 * Get active VIP subscriptions
 */
export async function getActiveVIPs(): Promise<AdminApiResponse<VIPSubscription[]>> {
  const active = getActiveVipSubscriptions();
  return simulateApiCall(active);
}

/**
 * Create new VIP subscription
 */
export async function createVIPSubscription(
  data: CreateVIPSubscriptionRequest
): Promise<AdminApiResponse<VIPSubscription>> {
  // Validate
  if (!data.userId || !data.plan || !data.duration) {
    createErrorResponse('User ID, plan, and duration are required', 'VALIDATION_ERROR');
  }

  // Check if user already has active subscription
  const existing = getVipByUserId(data.userId);
  if (existing && existing.status === 'active') {
    createErrorResponse('User already has an active VIP subscription', 'DUPLICATE');
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + data.duration);

  const newVIP: VIPSubscription = {
    id: `vip-${Date.now()}`,
    userId: data.userId,
    userName: 'User Name', // In real app, fetch from user data
    userEmail: 'user@example.com',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User',
    plan: data.plan,
    status: 'active',
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    amount: data.amount,
    currency: 'USD',
    paymentMethod: data.paymentMethod,
    autoRenew: data.autoRenew || false,
    features: data.plan === 'premium' 
      ? ['Ad-free', 'Exclusive content', 'Priority support', 'Progress tracking']
      : ['All Premium features', 'Personal tutor', 'Certificates', 'Offline access', 'Custom learning path'],
    lastPaymentDate: startDate.toISOString().split('T')[0],
    nextBillingDate: data.autoRenew ? endDate.toISOString().split('T')[0] : undefined,
  };

  return simulateApiCall(newVIP, 1000);
}

/**
 * Update VIP subscription
 */
export async function updateVIPSubscription(
  vipId: string,
  data: UpdateVIPSubscriptionRequest
): Promise<AdminApiResponse<VIPSubscription>> {
  const vip = vipSubscriptions.find(v => v.id === vipId);
  
  if (!vip) {
    createErrorResponse('VIP subscription not found', 'NOT_FOUND');
  }

  const updatedVIP: VIPSubscription = {
    ...vip,
    ...data,
  };

  return simulateApiCall(updatedVIP);
}

/**
 * Cancel VIP subscription
 */
export async function cancelVIPSubscription(
  vipId: string,
  reason?: string
): Promise<AdminApiResponse<VIPSubscription>> {
  const vip = vipSubscriptions.find(v => v.id === vipId);
  
  if (!vip) {
    createErrorResponse('VIP subscription not found', 'NOT_FOUND');
  }

  const cancelledVIP: VIPSubscription = {
    ...vip,
    status: 'cancelled',
    autoRenew: false,
  };

  return simulateApiCall(cancelledVIP);
}

/**
 * Renew VIP subscription
 */
export async function renewVIPSubscription(
  vipId: string,
  duration: number // months
): Promise<AdminApiResponse<VIPSubscription>> {
  const vip = vipSubscriptions.find(v => v.id === vipId);
  
  if (!vip) {
    createErrorResponse('VIP subscription not found', 'NOT_FOUND');
  }

  const newEndDate = new Date(vip.endDate);
  newEndDate.setMonth(newEndDate.getMonth() + duration);

  const renewedVIP: VIPSubscription = {
    ...vip,
    status: 'active',
    endDate: newEndDate.toISOString().split('T')[0],
    lastPaymentDate: new Date().toISOString().split('T')[0],
    nextBillingDate: vip.autoRenew ? newEndDate.toISOString().split('T')[0] : undefined,
  };

  return simulateApiCall(renewedVIP);
}

/**
 * Extend VIP subscription
 */
export async function extendVIPSubscription(
  vipId: string,
  days: number
): Promise<AdminApiResponse<VIPSubscription>> {
  const vip = vipSubscriptions.find(v => v.id === vipId);
  
  if (!vip) {
    createErrorResponse('VIP subscription not found', 'NOT_FOUND');
  }

  const newEndDate = new Date(vip.endDate);
  newEndDate.setDate(newEndDate.getDate() + days);

  const extendedVIP: VIPSubscription = {
    ...vip,
    endDate: newEndDate.toISOString().split('T')[0],
  };

  return simulateApiCall(extendedVIP);
}

/**
 * Get VIP statistics
 */
export async function getVIPStats(): Promise<
  AdminApiResponse<{
    total: number;
    totalVIP: number;
    premiumUsers: number;
    eliteUsers: number;
    revenue: number;
    conversionRate: number;
    growthRate: number;
    active: number;
    cancelled: number;
    expiringSoon: number;
  }>
> {
  const stats = getVipStatsSummary();
  return simulateApiCall({
    total: stats.totalSubscriptions,
    totalVIP: stats.totalSubscriptions,
    premiumUsers: stats.activePremium,
    eliteUsers: stats.activeElite,
    revenue: stats.monthlyRevenue,
    conversionRate: stats.conversionRate,
    growthRate: 12.5,
    active: stats.activeSubscriptions,
    cancelled: stats.cancelledSubscriptions,
    expiringSoon: stats.expiringSoon,
  });
}

/**
 * Get all VIP users
 */
export async function getAllVIPUsers(params?: {
  page?: number;
  pageSize?: number;
  status?: 'active' | 'cancelled' | 'expired';
}): Promise<AdminApiResponse<any>> {
  return getAllVIPSubscriptions(
    params?.status ? { status: params.status } : undefined,
    params?.page || 1,
    params?.pageSize || 20
  );
}

/**
 * Get single VIP user
 */
export async function getVIPUser(userId: string): Promise<AdminApiResponse<any>> {
  return getVIPByUser(userId);
}

/**
 * Upgrade user to VIP
 */
export async function upgradeUserToVIP(params: {
  userId: string;
  plan: 'premium' | 'elite';
  duration: number;
}): Promise<AdminApiResponse<any>> {
  return createVIPSubscription({
    userId: params.userId,
    plan: params.plan,
    duration: params.duration,
    paymentMethod: 'credit_card',
    autoRenew: false,
  });
}

/**
 * Downgrade VIP user
 */
export async function downgradeVIPUser(params: {
  vipId: string;
}): Promise<AdminApiResponse<any>> {
  return cancelVIPSubscription(params.vipId, 'Downgraded by admin');
}

/**
 * Get VIP retention metrics
 */
export async function getVIPRetention(): Promise<AdminApiResponse<any>> {
  return simulateApiCall({
    monthly: 85.5,
    quarterly: 72.3,
    yearly: 68.9,
    churnRate: 3.2,
  });
}

/**
 * Get VIP revenue breakdown
 */
export async function getVIPRevenue(
  period: 'week' | 'month' | 'quarter' | 'year'
): Promise<
  AdminApiResponse<{
    total: number;
    premium: number;
    elite: number;
    revenueByMethod: Record<string, number>;
    revenueOverTime: Array<{ date: string; amount: number }>;
    topCustomers: Array<{
      userId: string;
      userName: string;
      totalSpent: number;
      plan: string;
    }>;
  }>
> {
  return simulateApiCall({
    total: 38200,
    premium: 14350,
    elite: 23850,
    revenueByMethod: {
      'credit-card': 25000,
      'paypal': 8200,
      'bank-transfer': 5000,
      'voucher': 0,
    },
    revenueOverTime: [
      { date: '2026-03-01', amount: 1200 },
      { date: '2026-03-08', amount: 1450 },
      { date: '2026-03-15', amount: 1350 },
      { date: '2026-03-22', amount: 1580 },
      { date: '2026-03-29', amount: 1420 },
    ],
    topCustomers: [
      {
        userId: 'user-101',
        userName: 'Emma Wilson',
        totalSpent: 5000,
        plan: 'elite',
      },
    ],
  });
}

/**
 * Get expiring subscriptions
 */
export async function getExpiringSubscriptions(
  daysAhead: number = 30
): Promise<AdminApiResponse<VIPSubscription[]>> {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + daysAhead);

  const expiring = vipSubscriptions.filter(v => {
    if (v.status !== 'active') return false;
    const endDate = new Date(v.endDate);
    return endDate <= threshold;
  });

  return simulateApiCall(expiring);
}

/**
 * Send renewal reminder
 */
export async function sendRenewalReminder(
  vipId: string
): Promise<AdminApiResponse<boolean>> {
  const vip = vipSubscriptions.find(v => v.id === vipId);
  
  if (!vip) {
    createErrorResponse('VIP subscription not found', 'NOT_FOUND');
  }

  return simulateApiCall(true, 1000);
}

/**
 * Process auto-renewals
 */
export async function processAutoRenewals(): Promise<
  AdminApiResponse<{
    processed: number;
    succeeded: number;
    failed: number;
    errors: Array<{ vipId: string; error: string }>;
  }>
> {
  return simulateApiCall(
    {
      processed: 15,
      succeeded: 14,
      failed: 1,
      errors: [
        { vipId: 'vip-003', error: 'Payment method expired' },
      ],
    },
    3000
  );
}

/**
 * Export VIP data
 */
export async function exportVIPData(
  filter?: VIPFilter,
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
      fileUrl: `/exports/vip-${Date.now()}.${format}`,
      fileName: `vip-export-${new Date().toISOString().split('T')[0]}.${format}`,
      totalRecords: vipSubscriptions.length,
    },
    2000
  );
}