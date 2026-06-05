import { createError, request } from "../utils/http";
import type { AdminApiResponse, Question } from "./types";

interface PaginatedAdminResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

type QuestionQuery = {
  page?: number;
  pageSize?: number;
  questionType?: string;
  lessonId?: number;
  searchTerm?: string;
};

function filterQuestions(questions: Question[], params?: QuestionQuery): Question[] {
  let result = [...questions];
  const term = params?.searchTerm?.trim().toLowerCase();

  if (params?.questionType) {
    result = result.filter((question) => question.questionType === params.questionType);
  }

  if (params?.lessonId) {
    result = result.filter((question) => question.lessonId === params.lessonId);
  }

  if (term) {
    result = result.filter((question) =>
      [question.content, question.instruction, question.correctAnswer]
        .some((value) => value?.toLowerCase().includes(term)),
    );
  }

  return result;
}

export async function getAllQuestions(
  params?: QuestionQuery,
): Promise<AdminApiResponse<PaginatedAdminResponse<Question>>> {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const response = await request<Question[]>("/questions", { method: "GET" });

  if (!response.success || !response.data) {
    return response as AdminApiResponse<PaginatedAdminResponse<Question>>;
  }

  const filteredQuestions = filterQuestions(response.data, params);
  const start = (page - 1) * pageSize;

  return {
    success: true,
    data: {
      data: filteredQuestions.slice(start, start + pageSize),
      total: filteredQuestions.length,
      page,
      pageSize,
      hasMore: start + pageSize < filteredQuestions.length,
    },
  };
}

export async function getQuestion(questionId: string | number): Promise<AdminApiResponse<Question>> {
  if (!questionId) {
    return createError("Question id is required", "VALIDATION_ERROR");
  }

  return request<Question>(`/questions/${questionId}`, { method: "GET" });
}

export async function createQuestion(): Promise<AdminApiResponse<never>> {
  return createError("Use createContentQuestion for question creation", "UNSUPPORTED");
}

export async function updateQuestion(): Promise<AdminApiResponse<never>> {
  return createError("Use updateContentQuestion for question updates", "UNSUPPORTED");
}

export async function deleteQuestion(): Promise<AdminApiResponse<never>> {
  return createError("Use deleteContentQuestion for question deletion", "UNSUPPORTED");
}

export async function activateQuestion(): Promise<AdminApiResponse<never>> {
  return createError("Question activation is not supported by the current backend contract", "UNSUPPORTED");
}

export async function deactivateQuestion(): Promise<AdminApiResponse<never>> {
  return createError("Question deactivation is not supported by the current backend contract", "UNSUPPORTED");
}

export async function bulkImportQuestions(): Promise<AdminApiResponse<never>> {
  return createError("Bulk question import is not supported by the current backend contract", "UNSUPPORTED");
}

export async function exportQuestions(): Promise<AdminApiResponse<never>> {
  return createError("Question export is not supported by the current backend contract", "UNSUPPORTED");
}

export async function getQuestionStats(): Promise<
  AdminApiResponse<{
    total: number;
    active: number;
    inactive: number;
  }>
> {
  const response = await request<Question[]>("/questions", { method: "GET" });

  if (!response.success || !response.data) {
    return response as AdminApiResponse<{ total: number; active: number; inactive: number }>;
  }

  return {
    success: true,
    data: {
      total: response.data.length,
      active: response.data.length,
      inactive: 0,
    },
  };
}
