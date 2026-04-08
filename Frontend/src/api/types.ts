// API Types & Interfaces

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export class ApiError extends Error {
  code: string;
  details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

// Request types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  avatar?: string;
}

export interface SubmitAnswerRequest {
  questionId: string;
  answer: string;
  timeSpent: number; // seconds
}

export interface CompleteExerciseRequest {
  lessonId: string;
  answers: SubmitAnswerRequest[];
  totalTime: number;
}

export interface SubmitTestRequest {
  testId: string;
  answers: SubmitAnswerRequest[];
  totalTime: number;
}

export interface PurchaseItemRequest {
  itemId: string;
  quantity?: number;
}

export interface ClaimQuestRequest {
  questId: string;
}

// Filter & Sort types
export interface LeaderboardFilter {
  period?: "daily" | "weekly" | "monthly" | "all-time";
  league?: "bronze" | "silver" | "gold" | "platinum" | "diamond";
}

export interface QuestFilter {
  type?: "daily" | "weekly" | "special";
  status?: "active" | "completed" | "claimed";
}

export interface ShopFilter {
  type?: "powerup" | "cosmetic" | "subscription" | "boost";
  isPurchased?: boolean;
}
