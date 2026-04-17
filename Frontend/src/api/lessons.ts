import { request, createError } from "./utils/http";
import type { ApiResponse } from "./types";

export interface SectionLessonProgressItem {
  lessonId: number;
  lessonTitle: string;
  lessonNumber: number;
  completed: boolean;
  unlocked: boolean;
  current: boolean;
}

export interface CompleteLessonRequest {
  lessonId: number;
  score: number;
  accuracy: number;
}

export interface CompleteLessonResult {
  id: number;
  completed: boolean;
  score: number;
  accuracy: number;
  progressPercent: number;
  coinsEarned: number;
  expEarned: number;
  currentExp: number;
  lastAccessedAt: string;
  completedAt: string;
  userId: number;
  lessonId: number;
}

export interface LessonDetailResult {
  id: number;
  lessonNumber: number;
  title: string;
  sectionId: number;
}

export async function getLessonsBySectionProgress(
  sectionId: number,
): Promise<ApiResponse<SectionLessonProgressItem[]>> {
  if (!sectionId || Number.isNaN(sectionId)) {
    return createError("Invalid sectionId", "INVALID_SECTION_ID");
  }

  return request<SectionLessonProgressItem[]>(
    `/progress/sections/${sectionId}/lessons`,
    {
      method: "GET",
    },
  );
}

export async function completeLesson(
  payload: CompleteLessonRequest,
): Promise<ApiResponse<CompleteLessonResult>> {
  if (!payload.lessonId || Number.isNaN(payload.lessonId)) {
    return createError("Invalid lessonId", "INVALID_LESSON_ID");
  }

  if (Number.isNaN(payload.score) || Number.isNaN(payload.accuracy)) {
    return createError("Invalid score or accuracy", "INVALID_COMPLETION_DATA");
  }

  return request<CompleteLessonResult>("/progress/lessons/complete", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getLessonById(
  lessonId: number,
): Promise<ApiResponse<LessonDetailResult>> {
  if (!lessonId || Number.isNaN(lessonId)) {
    return createError("Invalid lessonId", "INVALID_LESSON_ID");
  }

  return request<LessonDetailResult>(`/lessons/${lessonId}`, {
    method: "GET",
  });
}