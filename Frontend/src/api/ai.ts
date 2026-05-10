import type {
  AILearningAnalysis,
  ApiResponse,
  EssaySubmissionRequest,
  EssaySubmissionResult,
  EssaySubmissionWithImageRequest,
  LearningAnalysisResult,
  PersonalizedQuestionsRequest,
  SpeakingSubmissionRequest,
  SpeakingSubmissionResult,
} from "./types";
import type { QuestionDto } from "./questions";
import { createError, request } from "./utils/http";

const hasPositiveNumber = (value: number): boolean =>
  Number.isFinite(value) && value > 0;

export async function submitEssay(
  payload: EssaySubmissionRequest,
): Promise<ApiResponse<EssaySubmissionResult>> {
  if (!hasPositiveNumber(payload.questionId)) {
    return createError("Invalid question id", "VALIDATION_ERROR");
  }

  if (!payload.answerText.trim()) {
    return createError("Answer text is required", "VALIDATION_ERROR");
  }

  return request<EssaySubmissionResult>("/ai/essay/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function submitEssayWithImage(
  payload: EssaySubmissionWithImageRequest,
): Promise<ApiResponse<EssaySubmissionResult>> {
  if (!hasPositiveNumber(payload.questionId)) {
    return createError("Invalid question id", "VALIDATION_ERROR");
  }

  if (!payload.answerText.trim()) {
    return createError("Answer text is required", "VALIDATION_ERROR");
  }

  const formData = new FormData();
  formData.append("questionId", String(payload.questionId));
  formData.append("answerText", payload.answerText);

  if (payload.imageUrl?.trim()) {
    formData.append("imageUrl", payload.imageUrl.trim());
  }

  if (payload.imageFile) {
    formData.append("imageFile", payload.imageFile);
  }

  return request<EssaySubmissionResult>("/ai/essay/submit-image", {
    method: "POST",
    body: formData,
  });
}

export async function submitSpeaking(
  payload: SpeakingSubmissionRequest,
): Promise<ApiResponse<SpeakingSubmissionResult>> {
  if (!hasPositiveNumber(payload.questionId)) {
    return createError("Invalid question id", "VALIDATION_ERROR");
  }

  if (!payload.transcriptText.trim()) {
    return createError("Transcript text is required", "VALIDATION_ERROR");
  }

  const formData = new FormData();
  formData.append("questionId", String(payload.questionId));
  formData.append("transcriptText", payload.transcriptText);

  if (payload.audioFile) {
    formData.append("audioFile", payload.audioFile);
  }

  return request<SpeakingSubmissionResult>("/ai/speaking/submit", {
    method: "POST",
    body: formData,
  });
}

export async function getPersonalizedQuestions(
  payload: PersonalizedQuestionsRequest,
): Promise<ApiResponse<QuestionDto[]>> {
  if (!hasPositiveNumber(payload.questionCount)) {
    return createError("Question count must be greater than 0", "VALIDATION_ERROR");
  }

  if (!hasPositiveNumber(payload.gradeId)) {
    return createError("Invalid grade id", "VALIDATION_ERROR");
  }

  if (!hasPositiveNumber(payload.unitNumber)) {
    return createError("Invalid unit number", "VALIDATION_ERROR");
  }

  return request<QuestionDto[]>("/ai/personalized-questions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMyLearningAnalysis(): Promise<ApiResponse<AILearningAnalysis | null>> {
  return request<AILearningAnalysis | null>("/ai/learning-analysis/me", {
    method: "GET",
  });
}

export async function getMyLearningAnalysisHistory(): Promise<
  ApiResponse<AILearningAnalysis[]>
> {
  return request<AILearningAnalysis[]>("/ai/learning-analysis/me/history", {
    method: "GET",
  });
}
