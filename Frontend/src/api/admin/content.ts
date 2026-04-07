// Admin Content Management API

import { contentItems, getContentById, getContentByUnit, getContentStatsSummary } from '@/data/mockDataAdmin';
import { units, getLessonsByUnitId } from '@/data/mockData';
import { simulateApiCall, createErrorResponse } from '../client';
import type { AdminApiResponse, PaginatedAdminResponse, ContentFilter, CreateContentRequest, UpdateContentRequest } from './types';
import type { ContentItem } from '@/data/mockDataAdmin';
import type { Unit, Lesson } from '@/data/mockData';

/**
 * Get all units (admin version)
 */
export async function getAllUnits(): Promise<AdminApiResponse<Unit[]>> {
  return simulateApiCall(units);
}

/**
 * Get single unit (admin version)
 */
export async function getUnit(params: { unitId: number }): Promise<AdminApiResponse<Unit>> {
  const unit = units.find(u => u.id === params.unitId);
  
  if (!unit) {
    createErrorResponse('Unit not found', 'NOT_FOUND');
  }

  return simulateApiCall(unit);
}

/**
 * Create new unit
 */
export async function createUnit(data: {
  title: string;
  description: string;
  icon?: string;
}): Promise<AdminApiResponse<Unit>> {
  const newUnit: Unit = {
    id: units.length + 1,
    title: data.title,
    description: data.description,
    icon: data.icon || '📚',
    totalLessons: 0,
    completedLessons: 0,
    progress: 0,
    isLocked: false,
    requiredLevel: 1,
    xpReward: 100,
    coinsReward: 50,
  };

  return simulateApiCall(newUnit, 1000);
}

/**
 * Update unit
 */
export async function updateUnit(params: {
  unitId: number;
  data: Partial<Unit>;
}): Promise<AdminApiResponse<Unit>> {
  const unit = units.find(u => u.id === params.unitId);
  
  if (!unit) {
    createErrorResponse('Unit not found', 'NOT_FOUND');
  }

  const updatedUnit = {
    ...unit,
    ...params.data,
  };

  return simulateApiCall(updatedUnit);
}

/**
 * Delete unit
 */
export async function deleteUnit(params: { unitId: number }): Promise<AdminApiResponse<boolean>> {
  const unit = units.find(u => u.id === params.unitId);
  
  if (!unit) {
    createErrorResponse('Unit not found', 'NOT_FOUND');
  }

  return simulateApiCall(true, 1000);
}

/**
 * Get lessons by unit (admin version)
 */
export async function getLessonsByUnit(params: { unitId: number }): Promise<AdminApiResponse<Lesson[]>> {
  const lessons = getLessonsByUnitId(params.unitId);
  return simulateApiCall(lessons);
}

/**
 * Get single lesson (admin version)
 */
export async function getLesson(params: { lessonId: string }): Promise<AdminApiResponse<Lesson>> {
  const allLessons = units.flatMap(u => getLessonsByUnitId(u.id));
  const lesson = allLessons.find(l => l.id === params.lessonId);
  
  if (!lesson) {
    createErrorResponse('Lesson not found', 'NOT_FOUND');
  }

  return simulateApiCall(lesson);
}

/**
 * Create new lesson
 */
export async function createLesson(data: {
  unitId: number;
  title: string;
  description: string;
  type: string;
}): Promise<AdminApiResponse<Lesson>> {
  const newLesson: Lesson = {
    id: `lesson-${Date.now()}`,
    unitId: data.unitId,
    lessonNumber: 1,
    title: data.title,
    description: data.description,
    type: data.type as any,
    icon: '📖',
    xpReward: 50,
    coinsReward: 10,
    isLocked: false,
    isCompleted: false,
  };

  return simulateApiCall(newLesson, 1000);
}

/**
 * Update lesson
 */
export async function updateLesson(params: {
  lessonId: string;
  data: Partial<Lesson>;
}): Promise<AdminApiResponse<Lesson>> {
  const allLessons = units.flatMap(u => getLessonsByUnitId(u.id));
  const lesson = allLessons.find(l => l.id === params.lessonId);
  
  if (!lesson) {
    createErrorResponse('Lesson not found', 'NOT_FOUND');
  }

  const updatedLesson = {
    ...lesson,
    ...params.data,
  };

  return simulateApiCall(updatedLesson);
}

/**
 * Delete lesson
 */
export async function deleteLesson(params: { lessonId: string }): Promise<AdminApiResponse<boolean>> {
  const allLessons = units.flatMap(u => getLessonsByUnitId(u.id));
  const lesson = allLessons.find(l => l.id === params.lessonId);
  
  if (!lesson) {
    createErrorResponse('Lesson not found', 'NOT_FOUND');
  }

  return simulateApiCall(true, 1000);
}

/**
 * Publish lesson
 */
export async function publishLesson(params: { lessonId: string }): Promise<AdminApiResponse<Lesson>> {
  const allLessons = units.flatMap(u => getLessonsByUnitId(u.id));
  const lesson = allLessons.find(l => l.id === params.lessonId);
  
  if (!lesson) {
    createErrorResponse('Lesson not found', 'NOT_FOUND');
  }

  return simulateApiCall(lesson);
}

/**
 * Archive lesson
 */
export async function archiveLesson(params: { lessonId: string }): Promise<AdminApiResponse<Lesson>> {
  const allLessons = units.flatMap(u => getLessonsByUnitId(u.id));
  const lesson = allLessons.find(l => l.id === params.lessonId);
  
  if (!lesson) {
    createErrorResponse('Lesson not found', 'NOT_FOUND');
  }

  return simulateApiCall(lesson);
}

/**
 * Reorder lessons
 */
export async function reorderLessons(params: {
  unitId: number;
  lessonIds: string[];
}): Promise<AdminApiResponse<boolean>> {
  return simulateApiCall(true);
}

/**
 * Get all content with pagination
 */
export async function getAllContent(
  filter?: ContentFilter,
  page: number = 1,
  pageSize: number = 20
): Promise<AdminApiResponse<PaginatedAdminResponse<ContentItem>>> {
  let filteredContent = [...contentItems];

  // Apply filters
  if (filter?.type) {
    filteredContent = filteredContent.filter(c => c.type === filter.type);
  }
  if (filter?.status) {
    filteredContent = filteredContent.filter(c => c.status === filter.status);
  }
  if (filter?.difficulty) {
    filteredContent = filteredContent.filter(c => c.difficulty === filter.difficulty);
  }
  if (filter?.unitId) {
    filteredContent = filteredContent.filter(c => c.unitId === filter.unitId);
  }

  // Pagination
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedData = filteredContent.slice(start, end);

  return simulateApiCall({
    data: paginatedData,
    total: filteredContent.length,
    page,
    pageSize,
    hasMore: end < filteredContent.length,
  });
}

/**
 * Get single content by ID
 */
export async function getContent(contentId: string): Promise<AdminApiResponse<ContentItem>> {
  const content = getContentById(contentId);
  
  if (!content) {
    createErrorResponse('Content not found', 'NOT_FOUND');
  }

  return simulateApiCall(content);
}

/**
 * Get content by unit
 */
export async function getContentByUnitId(unitId: number): Promise<AdminApiResponse<ContentItem[]>> {
  const content = getContentByUnit(unitId);
  return simulateApiCall(content);
}

/**
 * Create new content
 */
export async function createContent(data: CreateContentRequest): Promise<AdminApiResponse<ContentItem>> {
  // Validate
  if (!data.title || !data.description) {
    createErrorResponse('Title and description are required', 'VALIDATION_ERROR');
  }

  const newContent: ContentItem = {
    id: `content-${Date.now()}`,
    type: data.type,
    title: data.title,
    description: data.description,
    unitId: data.unitId,
    lessonType: data.lessonType as any,
    difficulty: data.difficulty,
    status: data.status || 'draft',
    author: 'Current Admin',
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
    views: 0,
    completionRate: 0,
    averageRating: 0,
    totalRatings: 0,
  };

  return simulateApiCall(newContent, 1000);
}

/**
 * Update content
 */
export async function updateContent(
  contentId: string,
  data: UpdateContentRequest
): Promise<AdminApiResponse<ContentItem>> {
  const content = getContentById(contentId);
  
  if (!content) {
    createErrorResponse('Content not found', 'NOT_FOUND');
  }

  const updatedContent: ContentItem = {
    ...content,
    ...data,
    updatedAt: new Date().toISOString().split('T')[0],
  };

  return simulateApiCall(updatedContent);
}

/**
 * Delete content
 */
export async function deleteContent(contentId: string): Promise<AdminApiResponse<boolean>> {
  const content = getContentById(contentId);
  
  if (!content) {
    createErrorResponse('Content not found', 'NOT_FOUND');
  }

  return simulateApiCall(true, 1000);
}

/**
 * Publish content
 */
export async function publishContent(contentId: string): Promise<AdminApiResponse<ContentItem>> {
  const content = getContentById(contentId);
  
  if (!content) {
    createErrorResponse('Content not found', 'NOT_FOUND');
  }

  const publishedContent: ContentItem = {
    ...content,
    status: 'published',
    updatedAt: new Date().toISOString().split('T')[0],
  };

  return simulateApiCall(publishedContent);
}

/**
 * Archive content
 */
export async function archiveContent(contentId: string): Promise<AdminApiResponse<ContentItem>> {
  const content = getContentById(contentId);
  
  if (!content) {
    createErrorResponse('Content not found', 'NOT_FOUND');
  }

  const archivedContent: ContentItem = {
    ...content,
    status: 'archived',
    updatedAt: new Date().toISOString().split('T')[0],
  };

  return simulateApiCall(archivedContent);
}

/**
 * Get content statistics
 */
export async function getContentStats(): Promise<
  AdminApiResponse<ReturnType<typeof getContentStatsSummary>>
> {
  const stats = getContentStatsSummary();
  return simulateApiCall(stats);
}

/**
 * Get content analytics
 */
export async function getContentAnalytics(contentId: string): Promise<
  AdminApiResponse<{
    contentId: string;
    views: number;
    uniqueViews: number;
    completionRate: number;
    averageScore: number;
    averageTime: number; // minutes
    ratingDistribution: Record<number, number>;
    viewsOverTime: Array<{ date: string; views: number }>;
    userFeedback: Array<{
      userId: string;
      userName: string;
      rating: number;
      comment: string;
      timestamp: string;
    }>;
  }>
> {
  return simulateApiCall({
    contentId,
    views: 5678,
    uniqueViews: 4521,
    completionRate: 88.7,
    averageScore: 87.5,
    averageTime: 35,
    ratingDistribution: {
      5: 450,
      4: 320,
      3: 60,
      2: 20,
      1: 6,
    },
    viewsOverTime: [
      { date: '2026-04-01', views: 120 },
      { date: '2026-04-02', views: 145 },
      { date: '2026-04-03', views: 132 },
      { date: '2026-04-04', views: 158 },
      { date: '2026-04-05', views: 141 },
      { date: '2026-04-06', views: 167 },
      { date: '2026-04-07', views: 153 },
    ],
    userFeedback: [
      {
        userId: 'user-001',
        userName: 'The Scholar',
        rating: 5,
        comment: 'Excellent lesson! Very clear explanations.',
        timestamp: '2026-04-07T14:30:00Z',
      },
    ],
  });
}

/**
 * Duplicate content
 */
export async function duplicateContent(contentId: string): Promise<AdminApiResponse<ContentItem>> {
  const content = getContentById(contentId);
  
  if (!content) {
    createErrorResponse('Content not found', 'NOT_FOUND');
  }

  const duplicatedContent: ContentItem = {
    ...content,
    id: `content-${Date.now()}`,
    title: `${content.title} (Copy)`,
    status: 'draft',
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
    views: 0,
    completionRate: 0,
    averageRating: 0,
    totalRatings: 0,
  };

  return simulateApiCall(duplicatedContent, 1000);
}

/**
 * Bulk publish content
 */
export async function bulkPublishContent(
  contentIds: string[]
): Promise<
  AdminApiResponse<{
    published: number;
    failed: number;
    errors: Array<{ contentId: string; error: string }>;
  }>
> {
  return simulateApiCall(
    {
      published: contentIds.length,
      failed: 0,
      errors: [],
    },
    1500
  );
}

/**
 * Bulk delete content
 */
export async function bulkDeleteContent(
  contentIds: string[]
): Promise<
  AdminApiResponse<{
    deleted: number;
    failed: number;
    errors: Array<{ contentId: string; error: string }>;
  }>
> {
  return simulateApiCall(
    {
      deleted: contentIds.length,
      failed: 0,
      errors: [],
    },
    2000
  );
}

/**
 * Reorder content
 */
export async function reorderContent(
  contentIds: string[]
): Promise<AdminApiResponse<boolean>> {
  return simulateApiCall(true);
}

/**
 * Export content
 */
export async function exportContent(
  filter?: ContentFilter,
  format: 'csv' | 'json' | 'xlsx' = 'json'
): Promise<
  AdminApiResponse<{
    fileUrl: string;
    fileName: string;
    totalRecords: number;
  }>
> {
  return simulateApiCall(
    {
      fileUrl: `/exports/content-${Date.now()}.${format}`,
      fileName: `content-export-${new Date().toISOString().split('T')[0]}.${format}`,
      totalRecords: contentItems.length,
    },
    2000
  );
}