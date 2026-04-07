// Admin Settings API

import { systemSettings, getSettingsByCategory, getSettingValue } from '@/data/mockDataAdmin';
import { simulateApiCall, createErrorResponse } from '../client';
import type { AdminApiResponse, SettingsFilter, UpdateSettingRequest } from './types';
import type { SystemSettings } from '@/data/mockDataAdmin';

/**
 * Get system settings (wrapper for getAllSettings)
 */
export async function getSystemSettings(): Promise<AdminApiResponse<any>> {
  const settings = await getAllSettings();
  
  // Convert array to object for easier access
  const settingsObj: any = {};
  if (settings.success && settings.data) {
    settings.data.forEach((setting: SystemSettings) => {
      // Convert camelCase keys
      const key = setting.key
        .split('_')
        .map((word, index) => 
          index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join('');
      settingsObj[key] = setting.value;
    });
  }

  return simulateApiCall({
    platformName: settingsObj.platformName || 'UIFIVE',
    enableRegistration: settingsObj.enableRegistration ?? true,
    enableVIP: settingsObj.enableVip ?? true,
    maintenanceMode: settingsObj.maintenanceMode ?? false,
    xpPerLesson: settingsObj.xpPerLesson || 50,
    coinsPerLesson: settingsObj.coinsPerLesson || 10,
    streakBonus: settingsObj.streakBonus || 5,
    dailyQuestLimit: settingsObj.dailyQuestLimit || 3,
  });
}

/**
 * Update system settings
 */
export async function updateSystemSettings(params: {
  settings: any;
}): Promise<AdminApiResponse<any>> {
  // In real app, would update each setting individually
  return simulateApiCall(params.settings, 1000);
}

/**
 * Reset settings to defaults
 */
export async function resetSettings(): Promise<AdminApiResponse<any>> {
  return getSystemSettings();
}

/**
 * Get all settings
 */
export async function getAllSettings(filter?: SettingsFilter): Promise<AdminApiResponse<SystemSettings[]>> {
  let filteredSettings = [...systemSettings];

  // Apply filters
  if (filter?.category) {
    filteredSettings = filteredSettings.filter(s => s.category === filter.category);
  }

  return simulateApiCall(filteredSettings);
}

/**
 * Get settings by category
 */
export async function getSettingsByCategoryApi(
  category: 'general' | 'security' | 'email' | 'payment' | 'gamification' | 'api'
): Promise<AdminApiResponse<SystemSettings[]>> {
  const settings = getSettingsByCategory(category);
  return simulateApiCall(settings);
}

/**
 * Get single setting by key
 */
export async function getSetting(key: string): Promise<AdminApiResponse<SystemSettings>> {
  const setting = systemSettings.find(s => s.key === key);
  
  if (!setting) {
    createErrorResponse('Setting not found', 'NOT_FOUND');
  }

  return simulateApiCall(setting);
}

/**
 * Get setting value
 */
export async function getSettingValueApi(
  key: string
): Promise<AdminApiResponse<string | number | boolean>> {
  const value = getSettingValue(key);
  
  if (value === undefined) {
    createErrorResponse('Setting not found', 'NOT_FOUND');
  }

  return simulateApiCall(value);
}

/**
 * Update setting
 */
export async function updateSetting(
  key: string,
  data: UpdateSettingRequest
): Promise<AdminApiResponse<SystemSettings>> {
  const setting = systemSettings.find(s => s.key === key);
  
  if (!setting) {
    createErrorResponse('Setting not found', 'NOT_FOUND');
  }

  // Validate data type
  if (setting.dataType === 'boolean' && typeof data.value !== 'boolean') {
    createErrorResponse('Value must be boolean', 'VALIDATION_ERROR');
  }
  if (setting.dataType === 'number' && typeof data.value !== 'number') {
    createErrorResponse('Value must be number', 'VALIDATION_ERROR');
  }
  if (setting.dataType === 'string' && typeof data.value !== 'string') {
    createErrorResponse('Value must be string', 'VALIDATION_ERROR');
  }

  const updatedSetting: SystemSettings = {
    ...setting,
    value: data.value,
    lastModified: new Date().toISOString().split('T')[0],
    modifiedBy: 'admin-001',
  };

  return simulateApiCall(updatedSetting);
}

/**
 * Bulk update settings
 */
export async function bulkUpdateSettings(
  updates: Array<{ key: string; value: string | number | boolean }>
): Promise<
  AdminApiResponse<{
    updated: number;
    failed: number;
    errors: Array<{ key: string; error: string }>;
  }>
> {
  return simulateApiCall(
    {
      updated: updates.length,
      failed: 0,
      errors: [],
    },
    1500
  );
}

/**
 * Reset setting to default
 */
export async function resetSetting(key: string): Promise<AdminApiResponse<SystemSettings>> {
  const setting = systemSettings.find(s => s.key === key);
  
  if (!setting) {
    createErrorResponse('Setting not found', 'NOT_FOUND');
  }

  // Default values (in real app, these would come from a defaults config)
  const defaults: Record<string, any> = {
    maintenance_mode: false,
    session_timeout: 3600,
    max_login_attempts: 5,
    require_email_verification: true,
    premium_monthly_price: 500,
    elite_yearly_price: 5000,
    xp_per_level: 300,
    streak_freeze_price: 30,
    daily_goal_xp: 50,
    api_rate_limit: 100,
  };

  const defaultValue = defaults[key] ?? setting.value;

  const resetSetting: SystemSettings = {
    ...setting,
    value: defaultValue,
    lastModified: new Date().toISOString().split('T')[0],
    modifiedBy: 'system',
  };

  return simulateApiCall(resetSetting);
}

/**
 * Reset all settings in category
 */
export async function resetCategorySettings(
  category: string
): Promise<
  AdminApiResponse<{
    reset: number;
    failed: number;
    errors: Array<{ key: string; error: string }>;
  }>
> {
  const categorySettings = getSettingsByCategory(category);
  
  return simulateApiCall(
    {
      reset: categorySettings.length,
      failed: 0,
      errors: [],
    },
    2000
  );
}

/**
 * Get settings history
 */
export async function getSettingsHistory(
  key: string,
  limit: number = 10
): Promise<
  AdminApiResponse<
    Array<{
      id: string;
      key: string;
      oldValue: string | number | boolean;
      newValue: string | number | boolean;
      modifiedBy: string;
      modifiedAt: string;
    }>
  >
> {
  return simulateApiCall([
    {
      id: 'hist-001',
      key,
      oldValue: true,
      newValue: false,
      modifiedBy: 'admin-001',
      modifiedAt: '2026-04-07T17:30:00Z',
    },
    {
      id: 'hist-002',
      key,
      oldValue: false,
      newValue: true,
      modifiedBy: 'admin-001',
      modifiedAt: '2026-04-01T09:00:00Z',
    },
  ].slice(0, limit));
}

/**
 * Export settings
 */
export async function exportSettings(
  format: 'json' | 'yaml' | 'env' = 'json'
): Promise<
  AdminApiResponse<{
    fileUrl: string;
    fileName: string;
    totalSettings: number;
  }>
> {
  return simulateApiCall(
    {
      fileUrl: `/exports/settings-${Date.now()}.${format}`,
      fileName: `settings-export-${new Date().toISOString().split('T')[0]}.${format}`,
      totalSettings: systemSettings.length,
    },
    1500
  );
}

/**
 * Import settings
 */
export async function importSettings(
  file: File,
  format: 'json' | 'yaml' | 'env'
): Promise<
  AdminApiResponse<{
    imported: number;
    updated: number;
    failed: number;
    errors: Array<{ key: string; error: string }>;
  }>
> {
  return simulateApiCall(
    {
      imported: 5,
      updated: 10,
      failed: 0,
      errors: [],
    },
    3000
  );
}

/**
 * Validate setting value
 */
export async function validateSettingValue(
  key: string,
  value: string | number | boolean
): Promise<
  AdminApiResponse<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }>
> {
  const setting = systemSettings.find(s => s.key === key);
  
  if (!setting) {
    createErrorResponse('Setting not found', 'NOT_FOUND');
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  // Type check
  if (setting.dataType === 'boolean' && typeof value !== 'boolean') {
    errors.push('Value must be boolean');
  }
  if (setting.dataType === 'number' && typeof value !== 'number') {
    errors.push('Value must be number');
  }
  if (setting.dataType === 'string' && typeof value !== 'string') {
    errors.push('Value must be string');
  }

  // Range checks for specific settings
  if (key === 'session_timeout' && typeof value === 'number') {
    if (value < 300) errors.push('Session timeout must be at least 300 seconds (5 minutes)');
    if (value > 86400) errors.push('Session timeout cannot exceed 86400 seconds (24 hours)');
    if (value < 1800) warnings.push('Session timeout below 30 minutes may affect user experience');
  }

  if (key === 'max_login_attempts' && typeof value === 'number') {
    if (value < 1) errors.push('Must allow at least 1 login attempt');
    if (value > 10) warnings.push('More than 10 attempts may reduce security');
  }

  if (key === 'api_rate_limit' && typeof value === 'number') {
    if (value < 10) errors.push('Rate limit too low, minimum is 10 requests per minute');
    if (value > 1000) warnings.push('High rate limit may impact server performance');
  }

  return simulateApiCall({
    valid: errors.length === 0,
    errors,
    warnings,
  });
}

/**
 * Get public settings (for client-side)
 */
export async function getPublicSettings(): Promise<
  AdminApiResponse<Record<string, string | number | boolean>>
> {
  const publicSettings = systemSettings
    .filter(s => s.isPublic)
    .reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, string | number | boolean>);

  return simulateApiCall(publicSettings);
}

/**
 * Test email settings
 */
export async function testEmailSettings(): Promise<
  AdminApiResponse<{
    success: boolean;
    message: string;
    details: {
      smtpConnection: boolean;
      authentication: boolean;
      testEmailSent: boolean;
    };
  }>
> {
  return simulateApiCall(
    {
      success: true,
      message: 'Email settings are configured correctly',
      details: {
        smtpConnection: true,
        authentication: true,
        testEmailSent: true,
      },
    },
    2000
  );
}

/**
 * Clear cache
 */
export async function clearSettingsCache(): Promise<AdminApiResponse<boolean>> {
  return simulateApiCall(true, 1000);
}