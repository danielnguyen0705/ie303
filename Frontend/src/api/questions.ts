import { request, createError } from "./utils/http";
import type { ApiResponse } from "./types";

export type QuestionGroupType =
  | "NONE"
  | "READING_PASSAGE"
  | "LISTENING_PASSAGE"
  | "CLOZE_PASSAGE"
  | "WORD_BANK"
  | "MATCHING"
  | "WRITING_TASK"
  | "SPEAKING_TASK";

export type QuestionType =
  | "QUALITATIVE_MC"
  | "READING_MC"
  | "CLOZE_MC"
  | "TRUE_FALSE_NG"
  | "WORD_BANK_FILL"
  | "LIMITED_FILL"
  | "WORD_FORM"
  | "VERB_FORM"
  | "SENTENCE_REORDER"
  | "SENTENCE_REWRITE"
  | "ESSAY_WRITING"
  | "MATCHING"
  | "PRONUNCIATION"
  | "TOPIC_SPEAKING";

export interface QuestionOptionDto {
  id: number;
  optionKey: string;
  content: string;
  isCorrect: boolean;
}

export interface QuestionDto {
  id: number;
  questionType: QuestionType;
  content: string;
  instruction: string | null;
  hint: string | null;
  audioUrl: string | null;
  imageUrl: string | null;
  questionData: string | null;
  explanation: string | null;
  correctAnswer: string | null;
  lessonId: number;
  questionGroupId: number | null;
  options: QuestionOptionDto[];
}

export interface QuestionGroupDto {
  id: number;
  groupType: QuestionGroupType;
  title: string | null;
  instruction: string | null;
  sharedContent: string | null;
  audioUrl: string | null;
  imageUrl: string | null;
  groupData: string | null;
  lessonId: number;
  questions: QuestionDto[];
}

export interface LessonQuestionResponse {
  lessonId: number;
  singleQuestions: QuestionDto[];
  questionGroups: QuestionGroupDto[];
}

export interface SubmitQuestionHistoryRequest {
  questionId: number;
  answer_text: string;
}

export interface QuestionHistorySubmissionResult {
  id: number;
  answer_text: string;
  correct: boolean;
  answeredAt: string;
  userId: number;
  questionId: number;
}

export async function getQuestionById(
  questionId: number,
): Promise<ApiResponse<QuestionDto>> {
  if (!questionId || Number.isNaN(questionId)) {
    return createError("Invalid questionId", "INVALID_QUESTION_ID");
  }

  return request<QuestionDto>(`/questions/${questionId}`, {
    method: "GET",
  }, {
    key: `questions:by-id:${questionId}`,
    ttlMs: 10 * 60 * 1000,
  });
}

export async function getQuestionGroupById(
  questionGroupId: number,
): Promise<ApiResponse<QuestionGroupDto>> {
  if (!questionGroupId || Number.isNaN(questionGroupId)) {
    return createError("Invalid questionGroupId", "INVALID_QUESTION_GROUP_ID");
  }

  return request<QuestionGroupDto>(`/question-groups/${questionGroupId}`, {
    method: "GET",
  }, {
    key: `question-groups:by-id:${questionGroupId}`,
    ttlMs: 10 * 60 * 1000,
  });
}

export async function getQuestionsByLesson(
  lessonId: number,
): Promise<ApiResponse<LessonQuestionResponse>> {
  if (!lessonId || Number.isNaN(lessonId)) {
    return createError("Invalid lessonId", "INVALID_LESSON_ID");
  }

  return request<LessonQuestionResponse>(`/questions/lesson/${lessonId}`, {
    method: "GET",
  });
}

export async function submitQuestionHistory(
  payload: SubmitQuestionHistoryRequest,
): Promise<ApiResponse<QuestionHistorySubmissionResult>> {
  if (!payload.questionId || Number.isNaN(payload.questionId)) {
    return createError("Invalid questionId", "INVALID_QUESTION_ID");
  }

  if (!payload.answer_text || !payload.answer_text.trim()) {
    return createError("Answer text is required", "INVALID_ANSWER_TEXT");
  }

  return request<QuestionHistorySubmissionResult>("/user-question-histories/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
