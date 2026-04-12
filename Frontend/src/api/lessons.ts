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