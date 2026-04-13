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