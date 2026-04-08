// Admin Notifications API

import { notifications, getScheduledNotifications, getSentNotifications } from '@/data/mockDataAdmin';
import { simulateApiCall, createErrorResponse } from '../client';
import type { AdminApiResponse, PaginatedAdminResponse, NotificationFilter, CreateNotificationRequest, UpdateNotificationRequest } from './types';
import type { Notification } from '@/data/mockDataAdmin';

/**
 * Get notification history (wrapper for getAllNotifications)
 */
export async function getNotificationHistory(params: {
  page?: number;
  pageSize?: number;
  filter?: NotificationFilter;
}): Promise<AdminApiResponse<PaginatedAdminResponse<Notification>>> {
  return getAllNotifications(params.filter, params.page || 1, params.pageSize || 20);
}

/**
 * Get notification stats
 */
export async function getNotificationStats(): Promise<
  AdminApiResponse<{
    total: number;
    sent: number;
    scheduled: number;
    failed: number;
    delivered: number;
    deliveryRate: number;
  }>
> {
  const sent = getSentNotifications();
  const scheduled = getScheduledNotifications();
  
  return simulateApiCall({
    total: notifications.length,
    sent: sent.length,
    scheduled: scheduled.length,
    failed: 5,
    delivered: sent.length - 5,
    deliveryRate: 98.5,
  });
}

/**
 * Get all notifications with pagination
 */
export async function getAllNotifications(
  filter?: NotificationFilter,
  page: number = 1,
  pageSize: number = 20
): Promise<AdminApiResponse<PaginatedAdminResponse<Notification>>> {
  let filteredNotifications = [...notifications];

  // Apply filters
  if (filter?.type) {
    filteredNotifications = filteredNotifications.filter(n => n.type === filter.type);
  }
  if (filter?.status) {
    filteredNotifications = filteredNotifications.filter(n => n.status === filter.status);
  }
  if (filter?.priority) {
    filteredNotifications = filteredNotifications.filter(n => n.priority === filter.priority);
  }

  // Pagination
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedData = filteredNotifications.slice(start, end);

  return simulateApiCall({
    data: paginatedData,
    total: filteredNotifications.length,
    page,
    pageSize,
    hasMore: end < filteredNotifications.length,
  });
}

/**
 * Get single notification by ID
 */
export async function getNotification(notificationId: string): Promise<AdminApiResponse<Notification>> {
  const notification = notifications.find(n => n.id === notificationId);
  
  if (!notification) {
    return createErrorResponse('Notification not found', 'NOT_FOUND');
  }

  return simulateApiCall(notification);
}

/**
 * Get scheduled notifications
 */
export async function getScheduled(): Promise<AdminApiResponse<Notification[]>> {
  const scheduled = getScheduledNotifications();
  return simulateApiCall(scheduled);
}

/**
 * Get sent notifications
 */
export async function getSent(): Promise<AdminApiResponse<Notification[]>> {
  const sent = getSentNotifications();
  return simulateApiCall(sent);
}

/**
 * Create new notification
 */
export async function createNotification(
  data: CreateNotificationRequest
): Promise<AdminApiResponse<Notification>> {
  // Validate
  if (!data.title || !data.message) {
    return createErrorResponse('Title and message are required', 'VALIDATION_ERROR');
  }

  if (data.targetAudience === 'specific' && (!data.targetUserIds || data.targetUserIds.length === 0)) {
    return createErrorResponse('Target user IDs required for specific audience', 'VALIDATION_ERROR');
  }

  // Calculate total recipients
  let totalRecipients = 0;
  switch (data.targetAudience) {
    case 'all':
      totalRecipients = 12458; // Total users
      break;
    case 'students':
      totalRecipients = 10567;
      break;
    case 'teachers':
      totalRecipients = 124;
      break;
    case 'vip':
      totalRecipients = 1690;
      break;
    case 'specific':
      totalRecipients = data.targetUserIds?.length || 0;
      break;
  }

  const newNotification: Notification = {
    id: `notif-${Date.now()}`,
    type: data.type,
    priority: data.priority,
    title: data.title,
    message: data.message,
    targetAudience: data.targetAudience,
    targetUserIds: data.targetUserIds,
    scheduledFor: data.scheduledFor,
    status: data.scheduledFor ? 'scheduled' : 'draft',
    createdBy: 'admin-001',
    createdAt: new Date().toISOString(),
    readCount: 0,
    totalRecipients,
  };

  return simulateApiCall(newNotification, 1000);
}

/**
 * Update notification
 */
export async function updateNotification(
  notificationId: string,
  data: UpdateNotificationRequest
): Promise<AdminApiResponse<Notification>> {
  const notification = notifications.find(n => n.id === notificationId);
  
  if (!notification) {
    return createErrorResponse('Notification not found', 'NOT_FOUND');
  }

  if (notification.status === 'sent') {
    return createErrorResponse('Cannot update sent notification', 'INVALID_STATE');
  }

  const updatedNotification: Notification = {
    ...notification,
    ...data,
  };

  return simulateApiCall(updatedNotification);
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string): Promise<AdminApiResponse<boolean>> {
  const notification = notifications.find(n => n.id === notificationId);
  
  if (!notification) {
    return createErrorResponse('Notification not found', 'NOT_FOUND');
  }

  if (notification.status === 'sent') {
    return createErrorResponse('Cannot delete sent notification', 'INVALID_STATE');
  }

  return simulateApiCall(true, 1000);
}

/**
 * Send notification immediately
 */
export async function sendNotification(notificationId: string): Promise<
  AdminApiResponse<{
    notificationId: string;
    status: 'sent';
    sentAt: string;
    totalRecipients: number;
    deliveredCount: number;
    failedCount: number;
  }>
> {
  const notification = notifications.find(n => n.id === notificationId);
  
  if (!notification) {
    return createErrorResponse('Notification not found', 'NOT_FOUND');
  }

  if (notification.status === 'sent') {
    return createErrorResponse('Notification already sent', 'INVALID_STATE');
  }

  return simulateApiCall(
    {
      notificationId,
      status: 'sent',
      sentAt: new Date().toISOString(),
      totalRecipients: notification.totalRecipients,
      deliveredCount: notification.totalRecipients - 5,
      failedCount: 5,
    },
    2000
  );
}

/**
 * Schedule notification
 */
export async function scheduleNotification(
  notificationId: string,
  scheduledFor: string
): Promise<AdminApiResponse<Notification>> {
  const notification = notifications.find(n => n.id === notificationId);
  
  if (!notification) {
    return createErrorResponse('Notification not found', 'NOT_FOUND');
  }

  const scheduledNotification: Notification = {
    ...notification,
    scheduledFor,
    status: 'scheduled',
  };

  return simulateApiCall(scheduledNotification);
}

/**
 * Cancel scheduled notification
 */
export async function cancelScheduledNotification(
  notificationId: string
): Promise<AdminApiResponse<Notification>> {
  const notification = notifications.find(n => n.id === notificationId);
  
  if (!notification) {
    return createErrorResponse('Notification not found', 'NOT_FOUND');
  }

  if (notification.status !== 'scheduled') {
    return createErrorResponse('Notification is not scheduled', 'INVALID_STATE');
  }

  const cancelledNotification: Notification = {
    ...notification,
    status: 'draft',
    scheduledFor: undefined,
  };

  return simulateApiCall(cancelledNotification);
}

/**
 * Duplicate notification
 */
export async function duplicateNotification(
  notificationId: string
): Promise<AdminApiResponse<Notification>> {
  const notification = notifications.find(n => n.id === notificationId);
  
  if (!notification) {
    return createErrorResponse('Notification not found', 'NOT_FOUND');
  }

  const duplicatedNotification: Notification = {
    ...notification,
    id: `notif-${Date.now()}`,
    title: `${notification.title} (Copy)`,
    status: 'draft',
    createdAt: new Date().toISOString(),
    scheduledFor: undefined,
    sentAt: undefined,
    readCount: 0,
  };

  return simulateApiCall(duplicatedNotification, 1000);
}

/**
 * Get notification analytics
 */
export async function getNotificationAnalytics(
  notificationId: string
): Promise<
  AdminApiResponse<{
    notificationId: string;
    totalRecipients: number;
    delivered: number;
    read: number;
    clicked: number;
    failed: number;
    deliveryRate: number;
    readRate: number;
    clickRate: number;
    deviceBreakdown: Record<string, number>;
    readOverTime: Array<{ hour: string; count: number }>;
  }>
> {
  const notification = notifications.find(n => n.id === notificationId);
  
  if (!notification) {
    return createErrorResponse('Notification not found', 'NOT_FOUND');
  }

  return simulateApiCall({
    notificationId,
    totalRecipients: notification.totalRecipients,
    delivered: notification.totalRecipients - 5,
    read: notification.readCount,
    clicked: Math.floor(notification.readCount * (notification.clickRate || 0) / 100),
    failed: 5,
    deliveryRate: 99.6,
    readRate: (notification.readCount / notification.totalRecipients) * 100,
    clickRate: notification.clickRate || 0,
    deviceBreakdown: {
      desktop: 45,
      mobile: 42,
      tablet: 13,
    },
    readOverTime: [
      { hour: '00:00', count: 120 },
      { hour: '06:00', count: 450 },
      { hour: '12:00', count: 890 },
      { hour: '18:00', count: 650 },
    ],
  });
}

/**
 * Test notification (send to admin)
 */
export async function testNotification(
  notificationId: string
): Promise<AdminApiResponse<boolean>> {
  const notification = notifications.find(n => n.id === notificationId);
  
  if (!notification) {
    return createErrorResponse('Notification not found', 'NOT_FOUND');
  }

  return simulateApiCall(true, 1000);
}

/**
 * Bulk send notifications
 */
export async function bulkSendNotifications(
  notificationIds: string[]
): Promise<
  AdminApiResponse<{
    sent: number;
    failed: number;
    errors: Array<{ notificationId: string; error: string }>;
  }>
> {
  return simulateApiCall(
    {
      sent: notificationIds.length,
      failed: 0,
      errors: [],
    },
    3000
  );
}

/**
 * Bulk delete notifications
 */
export async function bulkDeleteNotifications(
  notificationIds: string[]
): Promise<
  AdminApiResponse<{
    deleted: number;
    failed: number;
    errors: Array<{ notificationId: string; error: string }>;
  }>
> {
  return simulateApiCall(
    {
      deleted: notificationIds.length,
      failed: 0,
      errors: [],
    },
    2000
  );
}