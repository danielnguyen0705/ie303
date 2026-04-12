import { request } from "../api/utils/http";
import type { ApiResponse } from "./types";
import type { Grade } from "@/api/content";

export async function getAllGrades(): Promise<ApiResponse<Grade[]>> {
  return request<Grade[]>("/grades", {
    method: "GET",
  });
}

export async function getGrade(id: number): Promise<ApiResponse<Grade>> {
  return request<Grade>(`/grades/${id}`, {
    method: "GET",
  });
}

export async function createGrade(
  payload: Partial<Grade>,
): Promise<ApiResponse<Grade>> {
  return request<Grade>("/grades", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateGrade(
  id: number,
  payload: Partial<Grade>,
): Promise<ApiResponse<Grade>> {
  return request<Grade>(`/grades/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteGrade(id: number): Promise<ApiResponse<void>> {
  return request<void>(`/grades/${id}`, {
    method: "DELETE",
  });
}