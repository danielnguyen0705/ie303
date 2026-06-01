import { request, createError } from "./utils/http";
import { clearCachePrefix } from "./utils/cache";
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

const TRUE_FALSE_OPTION_KEYS = ["A", "B", "C"] as const;
const TRUE_FALSE_OPTION_VALUES = ["True", "False", "Not Given"] as const;

function normalizeAnswerToken(value?: string | null): string {
  return String(value || "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function normalizeTrueFalseQuestion(question: QuestionDto): QuestionDto {
  if (question.questionType !== "TRUE_FALSE_NG") {
    return question;
  }

  const normalizedCorrect = normalizeAnswerToken(question.correctAnswer);
  const options = TRUE_FALSE_OPTION_VALUES.map((content, index) => {
    const optionKey = TRUE_FALSE_OPTION_KEYS[index];
    const existing = question.options.find(
      (option) =>
        normalizeAnswerToken(option.optionKey) === optionKey ||
        normalizeAnswerToken(option.content) === normalizeAnswerToken(content),
    );

    return {
      id: existing?.id ?? -(question.id * 10 + index + 1),
      optionKey,
      content,
      isCorrect:
        Boolean(existing?.isCorrect) ||
        normalizeAnswerToken(existing?.content) === normalizedCorrect ||
        normalizeAnswerToken(existing?.optionKey) === normalizedCorrect ||
        normalizeAnswerToken(content) === normalizedCorrect,
    };
  });

  return {
    ...question,
    options,
  };
}

function normalizeQuestion(question: QuestionDto): QuestionDto {
  return normalizeTrueFalseQuestion(question);
}

function normalizeQuestionGroup(group: QuestionGroupDto): QuestionGroupDto {
  return {
    ...group,
    questions: (group.questions ?? []).map(normalizeQuestion),
  };
}

function normalizeLessonQuestionResponse(
  response: LessonQuestionResponse,
): LessonQuestionResponse {
  return {
    ...response,
    singleQuestions: (response.singleQuestions ?? []).map(normalizeQuestion),
    questionGroups: (response.questionGroups ?? []).map(normalizeQuestionGroup),
  };
}

export async function getQuestionById(
  questionId: number,
): Promise<ApiResponse<QuestionDto>> {
  if (!questionId || Number.isNaN(questionId)) {
    return createError("Invalid questionId", "INVALID_QUESTION_ID");
  }

  const response = await request<QuestionDto>(`/questions/${questionId}`, {
    method: "GET",
  }, {
    key: `questions:by-id:${questionId}`,
    ttlMs: 10 * 60 * 1000,
  });

  if (response.success && response.data) {
    return {
      ...response,
      data: normalizeQuestion(response.data),
    };
  }

  return response;
}

export async function getQuestionGroupById(
  questionGroupId: number,
): Promise<ApiResponse<QuestionGroupDto>> {
  if (!questionGroupId || Number.isNaN(questionGroupId)) {
    return createError("Invalid questionGroupId", "INVALID_QUESTION_GROUP_ID");
  }

  const response = await request<QuestionGroupDto>(`/question-groups/${questionGroupId}`, {
    method: "GET",
  }, {
    key: `question-groups:by-id:${questionGroupId}`,
    ttlMs: 10 * 60 * 1000,
  });

  if (response.success && response.data) {
    return {
      ...response,
      data: normalizeQuestionGroup(response.data),
    };
  }

  return response;
}

export async function getQuestionsByLesson(
  lessonId: number,
): Promise<ApiResponse<LessonQuestionResponse>> {
  if (!lessonId || Number.isNaN(lessonId)) {
    return createError("Invalid lessonId", "INVALID_LESSON_ID");
  }

  const response = await request<LessonQuestionResponse>(`/questions/lesson/${lessonId}`, {
    method: "GET",
  });

  if (response.success && response.data) {
    return {
      ...response,
      data: normalizeLessonQuestionResponse(response.data),
    };
  }

  return response;
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

  const response = await request<QuestionHistorySubmissionResult>("/user-question-histories/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (response.success) {
    clearCachePrefix("leaderboard:");
  }

  return response;
}
