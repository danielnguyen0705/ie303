// Admin Question Bank API

import { 
  adminQuestions, 
  getQuestionById, 
  getQuestionsByCategory, 
  getQuestionsByDifficulty,
  getQuestionStatsSummary 
} from '@/data/mockDataAdmin';
import { simulateApiCall, createErrorResponse } from '../client';
import type { AdminApiResponse, PaginatedAdminResponse, QuestionFilter, CreateQuestionRequest, UpdateQuestionRequest } from './types';
import type { AdminQuestion } from '@/data/mockDataAdmin';

/**
 * Get all questions with pagination
 */
export async function getAllQuestions(
  params?: {
    filter?: QuestionFilter;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    category?: string;
    difficulty?: string;
    status?: string;
    unitId?: number;
    tags?: string[];
  }
): Promise<AdminApiResponse<PaginatedAdminResponse<AdminQuestion>>> {
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 20;
  let filteredQuestions = [...adminQuestions];

  // Apply filters from params or from filter object
  const filter = params?.filter || params;

  if (filter?.category || params?.category) {
    const category = filter?.category || params?.category;
    filteredQuestions = filteredQuestions.filter(q => q.category === category);
  }
  if (filter?.difficulty || params?.difficulty) {
    const difficulty = filter?.difficulty || params?.difficulty;
    filteredQuestions = filteredQuestions.filter(q => q.difficulty === difficulty);
  }
  if (filter?.status || params?.status) {
    const status = filter?.status || params?.status;
    filteredQuestions = filteredQuestions.filter(q => q.status === status);
  }
  if (filter?.unitId || params?.unitId) {
    const unitId = filter?.unitId || params?.unitId;
    filteredQuestions = filteredQuestions.filter(q => q.unitId === unitId);
  }
  if (filter?.tags && filter.tags.length > 0) {
    filteredQuestions = filteredQuestions.filter(q => 
      filter.tags!.some(tag => q.tags.includes(tag))
    );
  }

  // Apply sorting
  if (params?.sortBy) {
    filteredQuestions.sort((a, b) => {
      const aVal = a[params.sortBy as keyof AdminQuestion];
      const bVal = b[params.sortBy as keyof AdminQuestion];
      const order = params.sortOrder === 'desc' ? -1 : 1;
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * order;
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * order;
      }
      return 0;
    });
  }

  // Pagination
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedData = filteredQuestions.slice(start, end);

  return simulateApiCall({
    data: paginatedData,
    total: filteredQuestions.length,
    page,
    pageSize,
    hasMore: end < filteredQuestions.length,
  });
}

/**
 * Get single question by ID
 */
export async function getQuestion(questionId: string): Promise<AdminApiResponse<AdminQuestion>> {
  const question = getQuestionById(questionId);
  
  if (!question) {
    return createErrorResponse('Question not found', 'NOT_FOUND');
  }

  return simulateApiCall(question);
}

/**
 * Get questions by category
 */
export async function getQuestionsByCategoryApi(
  category: string
): Promise<AdminApiResponse<AdminQuestion[]>> {
  const questions = getQuestionsByCategory(category);
  return simulateApiCall(questions);
}

/**
 * Get questions by difficulty
 */
export async function getQuestionsByDifficultyApi(
  difficulty: string
): Promise<AdminApiResponse<AdminQuestion[]>> {
  const questions = getQuestionsByDifficulty(difficulty);
  return simulateApiCall(questions);
}

/**
 * Create new question
 */
export async function createQuestion(data: CreateQuestionRequest): Promise<AdminApiResponse<AdminQuestion>> {
  // Validate
  if (!data.question || !data.correctAnswer) {
    return createErrorResponse('Question and correct answer are required', 'VALIDATION_ERROR');
  }

  if (data.type === 'multiple-choice' && (!data.options || data.options.length < 2)) {
    return createErrorResponse('Multiple choice questions need at least 2 options', 'VALIDATION_ERROR');
  }

  const newQuestion: AdminQuestion = {
    id: `q-admin-${Date.now()}`,
    type: data.type,
    category: data.category,
    difficulty: data.difficulty,
    question: data.question,
    options: data.options,
    correctAnswer: data.correctAnswer,
    explanation: data.explanation,
    points: data.points,
    tags: data.tags,
    unitId: data.unitId,
    usageCount: 0,
    successRate: 0,
    averageTime: 0,
    createdBy: 'Current Admin',
    createdAt: new Date().toISOString().split('T')[0],
    status: 'active',
  };

  return simulateApiCall(newQuestion, 1000);
}

/**
 * Update question
 */
export async function updateQuestion(
  questionId: string,
  data: UpdateQuestionRequest
): Promise<AdminApiResponse<AdminQuestion>> {
  const question = getQuestionById(questionId);
  
  if (!question) {
    return createErrorResponse('Question not found', 'NOT_FOUND');
  }

  const updatedQuestion: AdminQuestion = {
    ...question,
    ...data,
  };

  return simulateApiCall(updatedQuestion);
}

/**
 * Delete question
 */
export async function deleteQuestion(params: { questionId: string }): Promise<AdminApiResponse<boolean>> {
  const question = getQuestionById(params.questionId);
  
  if (!question) {
    return createErrorResponse('Question not found', 'NOT_FOUND');
  }

  return simulateApiCall(true, 1000);
}

/**
 * Activate question
 */
export async function activateQuestion(questionId: string): Promise<AdminApiResponse<AdminQuestion>> {
  const question = getQuestionById(questionId);
  
  if (!question) {
    return createErrorResponse('Question not found', 'NOT_FOUND');
  }

  const activatedQuestion: AdminQuestion = {
    ...question,
    status: 'active',
  };

  return simulateApiCall(activatedQuestion);
}

/**
 * Deactivate question
 */
export async function deactivateQuestion(questionId: string): Promise<AdminApiResponse<AdminQuestion>> {
  const question = getQuestionById(questionId);
  
  if (!question) {
    return createErrorResponse('Question not found', 'NOT_FOUND');
  }

  const deactivatedQuestion: AdminQuestion = {
    ...question,
    status: 'inactive',
  };

  return simulateApiCall(deactivatedQuestion);
}

/**
 * Flag question for review
 */
export async function flagQuestionForReview(
  questionId: string,
  reason: string
): Promise<AdminApiResponse<AdminQuestion>> {
  const question = getQuestionById(questionId);
  
  if (!question) {
    return createErrorResponse('Question not found', 'NOT_FOUND');
  }

  const flaggedQuestion: AdminQuestion = {
    ...question,
    status: 'needs-review',
  };

  return simulateApiCall(flaggedQuestion);
}

/**
 * Get question statistics
 */
export async function getQuestionStats(): Promise<
  AdminApiResponse<ReturnType<typeof getQuestionStatsSummary>>
> {
  const stats = getQuestionStatsSummary();
  return simulateApiCall(stats);
}

/**
 * Get question analytics
 */
export async function getQuestionAnalytics(questionId: string): Promise<
  AdminApiResponse<{
    questionId: string;
    totalAttempts: number;
    correctAttempts: number;
    incorrectAttempts: number;
    successRate: number;
    averageTime: number;
    difficulty: string;
    performanceByLevel: Array<{
      level: string;
      successRate: number;
      attempts: number;
    }>;
    commonMistakes: Array<{
      answer: string;
      count: number;
      percentage: number;
    }>;
  }>
> {
  return simulateApiCall({
    questionId,
    totalAttempts: 5678,
    correctAttempts: 4968,
    incorrectAttempts: 710,
    successRate: 87.5,
    averageTime: 12,
    difficulty: 'easy',
    performanceByLevel: [
      { level: 'Beginner', successRate: 78.5, attempts: 2000 },
      { level: 'Intermediate', successRate: 89.2, attempts: 2500 },
      { level: 'Advanced', successRate: 95.1, attempts: 1178 },
    ],
    commonMistakes: [
      { answer: 'wash', count: 450, percentage: 63.4 },
      { answer: 'is washing', count: 180, percentage: 25.4 },
      { answer: 'has washed', count: 80, percentage: 11.2 },
    ],
  });
}

/**
 * Duplicate question
 */
export async function duplicateQuestion(questionId: string): Promise<AdminApiResponse<AdminQuestion>> {
  const question = getQuestionById(questionId);
  
  if (!question) {
    return createErrorResponse('Question not found', 'NOT_FOUND');
  }

  const duplicatedQuestion: AdminQuestion = {
    ...question,
    id: `q-admin-${Date.now()}`,
    question: `${question.question} (Copy)`,
    usageCount: 0,
    successRate: 0,
    averageTime: 0,
    createdAt: new Date().toISOString().split('T')[0],
  };

  return simulateApiCall(duplicatedQuestion, 1000);
}

/**
 * Bulk delete questions
 */
export async function bulkDeleteQuestions(
  questionIds: string[]
): Promise<
  AdminApiResponse<{
    deleted: number;
    failed: number;
    errors: Array<{ questionId: string; error: string }>;
  }>
> {
  return simulateApiCall(
    {
      deleted: questionIds.length,
      failed: 0,
      errors: [],
    },
    2000
  );
}

/**
 * Bulk update question status
 */
export async function bulkUpdateQuestionStatus(
  questionIds: string[],
  status: 'active' | 'inactive' | 'needs-review'
): Promise<
  AdminApiResponse<{
    updated: number;
    failed: number;
    errors: Array<{ questionId: string; error: string }>;
  }>
> {
  return simulateApiCall(
    {
      updated: questionIds.length,
      failed: 0,
      errors: [],
    },
    1500
  );
}

/**
 * Import questions from file
 */
export async function importQuestions(
  file: File,
  format: 'csv' | 'json' | 'xlsx'
): Promise<
  AdminApiResponse<{
    imported: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  }>
> {
  return simulateApiCall(
    {
      imported: 50,
      failed: 2,
      errors: [
        { row: 15, error: 'Missing correct answer' },
        { row: 28, error: 'Invalid question type' },
      ],
    },
    3000
  );
}

/**
 * Bulk import questions (wrapper for importQuestions)
 */
export async function bulkImportQuestions(
  questions: Array<Partial<AdminQuestion>>
): Promise<
  AdminApiResponse<{
    imported: number;
    failed: number;
    errors: Array<{ index: number; error: string }>;
  }>
> {
  // Validate each question
  const errors: Array<{ index: number; error: string }> = [];
  let imported = 0;

  questions.forEach((q, index) => {
    if (!q.question || !q.correctAnswer) {
      errors.push({ index, error: 'Missing required fields' });
    } else if (!q.type || !q.category || !q.difficulty) {
      errors.push({ index, error: 'Missing question metadata' });
    } else {
      imported++;
    }
  });

  return simulateApiCall(
    {
      imported,
      failed: errors.length,
      errors,
    },
    2500
  );
}

/**
 * Export questions
 */
export async function exportQuestions(
  filter?: QuestionFilter,
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
      fileUrl: `/exports/questions-${Date.now()}.${format}`,
      fileName: `questions-export-${new Date().toISOString().split('T')[0]}.${format}`,
      totalRecords: adminQuestions.length,
    },
    2000
  );
}

/**
 * Get all unique tags
 */
export async function getAllTags(): Promise<AdminApiResponse<string[]>> {
  const allTags = new Set<string>();
  adminQuestions.forEach(q => {
    q.tags.forEach(tag => allTags.add(tag));
  });
  
  return simulateApiCall(Array.from(allTags).sort());
}