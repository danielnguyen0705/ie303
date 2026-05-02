import { request, createError } from "./utils/http";
import type { ApiResponse } from "./types";

export interface UnitProgressItem {
  unitId: number;
  unitTitle: string;
  unitNumber: number;
  progressPercent: number;
}

export interface UnitResponse {
  id: number;
  unitNumber: number;
  title: string;
  description: string;
  gradeId: number;
}

/**
 * Get all units by grade with progress
 * BE endpoint:
 * /api/progress/grades/{gradeId}/unit
 *
 * BASE_URL already contains /api
 * => request path only needs /progress/grades/{gradeId}/unit
 */
export async function getUnitsByGradeProgress(
  gradeId: number,
): Promise<ApiResponse<UnitProgressItem[]>> {
  if (!gradeId || Number.isNaN(gradeId)) {
    return createError("Invalid gradeId", "INVALID_GRADE_ID");
  }

  return request<UnitProgressItem[]>(`/progress/grades/${gradeId}/units`, {
    method: "GET",
  });
}

/**
 * Optional: get single unit detail
 */
export async function getUnit(unitId: number): Promise<ApiResponse<UnitResponse>> {
  if (!unitId || Number.isNaN(unitId)) {
    return createError("Invalid unitId", "INVALID_UNIT_ID");
  }

  return request<UnitResponse>(`/progress/units/${unitId}/sections`, {
    method: "GET",
  });
}