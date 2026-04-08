// Units API

import { units, getUnitById } from '@/data/mockData';
import { simulateApiCall, createErrorResponse } from './client';
import type { ApiResponse } from './types';
import type { Unit } from '@/data/mockData';

/**
 * Get all units
 */
export async function getAllUnits(): Promise<ApiResponse<Unit[]>> {
  return simulateApiCall(units);
}

/**
 * Get units by semester
 */
export async function getUnitsBySemester(semester: 1 | 2): Promise<ApiResponse<Unit[]>> {
  const filteredUnits = units.filter(u => u.semester === semester);
  return simulateApiCall(filteredUnits);
}

/**
 * Get single unit by ID
 */
export async function getUnit(unitId: number): Promise<ApiResponse<Unit>> {
  const unit = getUnitById(unitId);
  
  if (!unit) {
    return createErrorResponse('Unit not found', 'NOT_FOUND');
  }

  return simulateApiCall(unit);
}

/**
 * Get unit progress
 */
export async function getUnitProgress(unitId: number): Promise<
  ApiResponse<{
    unitId: number;
    progress: number;
    completedLessons: number;
    totalLessons: number;
    averageScore: number;
    timeSpent: number; // minutes
    lastAccessed?: string;
  }>
> {
  const unit = getUnitById(unitId);
  
  if (!unit) {
    return createErrorResponse('Unit not found', 'NOT_FOUND');
  }

  return simulateApiCall({
    unitId,
    progress: unit.progress,
    completedLessons: unit.completedLessons,
    totalLessons: unit.totalLessons,
    averageScore: unitId === 1 ? 91.5 : unitId === 2 ? 87.2 : 0,
    timeSpent: unit.completedLessons * 35, // ~35 min per lesson
    lastAccessed: unitId <= 3 ? '2026-04-07T14:30:00Z' : undefined,
  });
}

/**
 * Start unit (unlock first lesson)
 */
export async function startUnit(unitId: number): Promise<ApiResponse<Unit>> {
  const unit = getUnitById(unitId);
  
  if (!unit) {
    return createErrorResponse('Unit not found', 'NOT_FOUND');
  }

  if (unit.status === 'locked') {
    return createErrorResponse('Unit is locked. Complete previous units first.', 'FORBIDDEN');
  }

  // Update unit status
  const updatedUnit: Unit = {
    ...unit,
    status: 'in-progress',
  };

  return simulateApiCall(updatedUnit);
}

/**
 * Complete unit
 */
export async function completeUnit(unitId: number): Promise<
  ApiResponse<{
    unit: Unit;
    rewards: {
      xp: number;
      coins: number;
      badge?: string;
    };
  }>
> {
  const unit = getUnitById(unitId);
  
  if (!unit) {
    return createErrorResponse('Unit not found', 'NOT_FOUND');
  }

  const completedUnit: Unit = {
    ...unit,
    progress: 100,
    status: 'completed',
    completedLessons: unit.totalLessons,
  };

  return simulateApiCall({
    unit: completedUnit,
    rewards: {
      xp: 100,
      coins: 50,
      badge: `unit-${unitId}-master`,
    },
  });
}

/**
 * Get curriculum overview
 */
export async function getCurriculumOverview(): Promise<
  ApiResponse<{
    totalUnits: number;
    completedUnits: number;
    inProgressUnits: number;
    lockedUnits: number;
    overallProgress: number;
    semester1Progress: number;
    semester2Progress: number;
  }>
> {
  const completed = units.filter(u => u.status === 'completed').length;
  const inProgress = units.filter(u => u.status === 'in-progress').length;
  const locked = units.filter(u => u.status === 'locked').length;
  
  const semester1Units = units.filter(u => u.semester === 1);
  const semester2Units = units.filter(u => u.semester === 2);
  
  const semester1Completed = semester1Units.filter(u => u.status === 'completed').length;
  const semester2Completed = semester2Units.filter(u => u.status === 'completed').length;

  return simulateApiCall({
    totalUnits: units.length,
    completedUnits: completed,
    inProgressUnits: inProgress,
    lockedUnits: locked,
    overallProgress: Math.round((completed / units.length) * 100),
    semester1Progress: Math.round((semester1Completed / semester1Units.length) * 100),
    semester2Progress: Math.round((semester2Completed / semester2Units.length) * 100),
  });
}

/**
 * Get next recommended unit
 */
export async function getNextUnit(): Promise<ApiResponse<Unit | null>> {
  const nextUnit = units.find(
    u => u.status === 'in-progress' || u.status === 'upcoming'
  );

  return simulateApiCall(nextUnit || null);
}
