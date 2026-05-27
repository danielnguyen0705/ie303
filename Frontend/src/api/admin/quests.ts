import type { ApiResponse } from "../types";
import type { QuestTemplate, QuestTemplateUpsertRequest } from "./types";
import { createError, request } from "../utils/http";

function validateTemplate(payload: QuestTemplateUpsertRequest): ApiResponse<never> | null {
  if (!payload.questPeriod) {
    return createError("Quest period is required", "VALIDATION_ERROR");
  }

  if (!payload.questType) {
    return createError("Quest type is required", "VALIDATION_ERROR");
  }

  if (!payload.title?.trim()) {
    return createError("Title is required", "VALIDATION_ERROR");
  }

  if (!payload.description?.trim()) {
    return createError("Description is required", "VALIDATION_ERROR");
  }

  if (!payload.targetAmount || payload.targetAmount <= 0) {
    return createError("Target amount must be greater than 0", "VALIDATION_ERROR");
  }

  if (payload.coinsReward < 0 || payload.expReward < 0) {
    return createError("Rewards must be non-negative", "VALIDATION_ERROR");
  }

  if (payload.rewardItemQuantity < 0) {
    return createError("Reward item quantity must be non-negative", "VALIDATION_ERROR");
  }

  return null;
}

function normalizeTemplate(payload: QuestTemplateUpsertRequest) {
  return {
    ...payload,
    title: payload.title.trim(),
    description: payload.description.trim(),
  };
}

export async function getQuestTemplates(
  period?: "DAILY" | "WEEKLY",
): Promise<ApiResponse<QuestTemplate[]>> {
  const suffix = period ? `?period=${period}` : "";
  return request<QuestTemplate[]>(`/admin/quest-templates${suffix}`, {
    method: "GET",
  });
}

export async function getQuestTemplateById(
  id: number,
): Promise<ApiResponse<QuestTemplate>> {
  if (!id || id <= 0) {
    return createError("Invalid quest template id", "VALIDATION_ERROR");
  }

  return request<QuestTemplate>(`/admin/quest-templates/${id}`, {
    method: "GET",
  });
}

export async function createQuestTemplate(
  payload: QuestTemplateUpsertRequest,
): Promise<ApiResponse<QuestTemplate>> {
  const validationError = validateTemplate(payload);
  if (validationError) {
    return validationError;
  }

  return request<QuestTemplate>("/admin/quest-templates", {
    method: "POST",
    body: JSON.stringify(normalizeTemplate(payload)),
  });
}

export async function updateQuestTemplate(
  id: number,
  payload: QuestTemplateUpsertRequest,
): Promise<ApiResponse<QuestTemplate>> {
  if (!id || id <= 0) {
    return createError("Invalid quest template id", "VALIDATION_ERROR");
  }

  const validationError = validateTemplate(payload);
  if (validationError) {
    return validationError;
  }

  return request<QuestTemplate>(`/admin/quest-templates/${id}`, {
    method: "PUT",
    body: JSON.stringify(normalizeTemplate(payload)),
  });
}

export async function deactivateQuestTemplate(
  id: number,
): Promise<ApiResponse<string>> {
  if (!id || id <= 0) {
    return createError("Invalid quest template id", "VALIDATION_ERROR");
  }

  return request<string>(`/admin/quest-templates/${id}`, {
    method: "DELETE",
  });
}
