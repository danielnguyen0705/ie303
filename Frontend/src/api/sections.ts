import { request, createError } from "./utils/http";
import type { ApiResponse } from "./types";

export interface SectionProgressItem {
  sectionId: number;
  sectionTitle: string;
  sectionNumber: number;
  progressPercent: number;
}

export interface SectionResponse {
  id: number;
  sectionNumber: number;
  title: string;
  description?: string;
  unitId: number;
}

export async function getSectionsByUnitProgress(
  unitId: number,
): Promise<ApiResponse<SectionProgressItem[]>> {
  if (!unitId || Number.isNaN(unitId)) {
    return createError("Invalid unitId", "INVALID_UNIT_ID");
  }

  return request<SectionProgressItem[]>(`/progress/units/${unitId}/sections`, {
    method: "GET",
  });
}

export async function getSection(
  sectionId: number,
): Promise<ApiResponse<SectionResponse>> {
  if (!sectionId || Number.isNaN(sectionId)) {
    return createError("Invalid sectionId", "INVALID_SECTION_ID");
  }

  return request<SectionResponse>(`/sections/${sectionId}`, {
    method: "GET",
  });
}

export async function createSection(
  payload: Partial<SectionResponse>,
): Promise<ApiResponse<SectionResponse>> {
  return request<SectionResponse>("/sections", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSection(
  sectionId: number,
  payload: Partial<SectionResponse>,
): Promise<ApiResponse<SectionResponse>> {
  if (!sectionId || Number.isNaN(sectionId)) {
    return createError("Invalid sectionId", "INVALID_SECTION_ID");
  }

  return request<SectionResponse>(`/sections/${sectionId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteSection(
  sectionId: number,
): Promise<ApiResponse<void>> {
  if (!sectionId || Number.isNaN(sectionId)) {
    return createError("Invalid sectionId", "INVALID_SECTION_ID");
  }

  return request<void>(`/sections/${sectionId}`, {
    method: "DELETE",
  });
}