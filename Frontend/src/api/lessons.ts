// Lessons API

import { lessons, getLessonsByUnitId } from '@/data/mockData';
import { simulateApiCall, createErrorResponse } from './client';
import type { ApiResponse } from './types';
import type { Lesson } from '@/data/mockData';

/**
 * Get all lessons for a unit
 */
export async function getLessonsByUnit(unitId: number): Promise<ApiResponse<Lesson[]>> {
  const unitLessons = getLessonsByUnitId(unitId);
  return simulateApiCall(unitLessons);
}

/**
 * Get single lesson
 */
export async function getLesson(lessonId: string): Promise<ApiResponse<Lesson>> {
  const lesson = lessons.find(l => l.id === lessonId);
  
  if (!lesson) {
    return createErrorResponse('Lesson not found', 'NOT_FOUND');
  }

  return simulateApiCall(lesson);
}

/**
 * Get lesson content
 */
export async function getLessonContent(lessonId: string): Promise<
  ApiResponse<{
    lesson: Lesson;
    content: {
      title: string;
      description: string;
      sections: Array<{
        type: 'text' | 'video' | 'audio' | 'exercise' | 'quiz';
        content: any;
      }>;
      resources: Array<{
        title: string;
        url: string;
        type: 'pdf' | 'link' | 'video';
      }>;
    };
  }>
> {
  const lesson = lessons.find(l => l.id === lessonId);
  
  if (!lesson) {
    return createErrorResponse('Lesson not found', 'NOT_FOUND');
  }

  return simulateApiCall({
    lesson,
    content: {
      title: lesson.title,
      description: 'Detailed lesson content and materials',
      sections: [
        {
          type: 'text' as const,
          content: 'Introduction to the topic...',
        },
        {
          type: 'video' as const,
          content: {
            url: 'https://example.com/video.mp4',
            duration: 300,
          },
        },
        {
          type: 'exercise' as const,
          content: {
            questions: [],
          },
        },
      ],
      resources: [
        {
          title: 'Grammar Reference',
          url: '/resources/grammar.pdf',
          type: 'pdf' as const,
        },
      ],
    },
  });
}

/**
 * Start lesson
 */
export async function startLesson(lessonId: string): Promise<ApiResponse<Lesson>> {
  const lesson = lessons.find(l => l.id === lessonId);
  
  if (!lesson) {
    return createErrorResponse('Lesson not found', 'NOT_FOUND');
  }

  if (lesson.status === 'locked') {
    return createErrorResponse('Lesson is locked. Complete previous lessons first.', 'FORBIDDEN');
  }

  return simulateApiCall(lesson);
}

/**
 * Complete lesson
 */
export async function completeLesson(
  lessonId: string,
  score: number,
  timeSpent: number
): Promise<
  ApiResponse<{
    lesson: Lesson;
    rewards: {
      xp: number;
      coins: number;
    };
    nextLesson?: Lesson;
  }>
> {
  const lesson = lessons.find(l => l.id === lessonId);
  
  if (!lesson) {
    return createErrorResponse('Lesson not found', 'NOT_FOUND');
  }

  // Update lesson
  const completedLesson: Lesson = {
    ...lesson,
    status: 'completed',
    completedAt: new Date().toISOString(),
    score,
  };

  // Find next lesson
  const currentIndex = lessons.findIndex(l => l.id === lessonId);
  const nextLesson = lessons[currentIndex + 1];

  return simulateApiCall({
    lesson: completedLesson,
    rewards: {
      xp: lesson.xpReward,
      coins: lesson.coinsReward,
    },
    nextLesson: nextLesson?.unitId === lesson.unitId ? nextLesson : undefined,
  });
}

/**
 * Get lesson progress
 */
export async function getLessonProgress(lessonId: string): Promise<
  ApiResponse<{
    lessonId: string;
    status: 'completed' | 'current' | 'locked';
    score?: number;
    attempts: number;
    bestScore: number;
    timeSpent: number; // seconds
    completedAt?: string;
  }>
> {
  const lesson = lessons.find(l => l.id === lessonId);
  
  if (!lesson) {
    return createErrorResponse('Lesson not found', 'NOT_FOUND');
  }

  return simulateApiCall({
    lessonId,
    status: lesson.status,
    score: lesson.score,
    attempts: lesson.status === 'completed' ? 1 : 0,
    bestScore: lesson.score || 0,
    timeSpent: lesson.duration * 60, // convert to seconds
    completedAt: lesson.completedAt,
  });
}

/**
 * Save lesson progress (for resuming)
 */
export async function saveLessonProgress(
  lessonId: string,
  progress: {
    currentSection: number;
    answers: any[];
    timeSpent: number;
  }
): Promise<ApiResponse<boolean>> {
  return simulateApiCall(true);
}

/**
 * Get saved lesson progress
 */
export async function getSavedProgress(lessonId: string): Promise<
  ApiResponse<{
    currentSection: number;
    answers: any[];
    timeSpent: number;
    savedAt: string;
  } | null>
> {
  // Return null if no saved progress
  return simulateApiCall(null);
}
