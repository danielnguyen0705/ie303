import type {
  ApiResponse,
  GroupReviewRequest,
  GroupReviewResponse,
  SemesterTestRequest,
  SemesterTestResponse,
  UnitReviewRequest,
  UnitReviewResponse,
} from "./types";
import { createError, request } from "./utils/http";
import { clearCachePrefix } from "./utils/cache";

const isPositiveNumber = (value: number): boolean =>
  Number.isFinite(value) && value > 0;

const hasOnlyPositiveNumbers = (values: number[]): boolean =>
  values.every((value) => isPositiveNumber(value));

const validateTitle = (title: string): string | null => {
  if (!title.trim()) {
    return "Title is required";
  }

  return null;
};

const validateUnitRange = (
  startUnit: number,
  endUnit: number,
): string | null => {
  if (!isPositiveNumber(startUnit) || !isPositiveNumber(endUnit)) {
    return "Invalid unit range";
  }

  if (startUnit > endUnit) {
    return "Start unit cannot be greater than end unit";
  }

  return null;
};

export async function createUnitReview(
  payload: UnitReviewRequest,
): Promise<ApiResponse<UnitReviewResponse>> {
  const titleError = validateTitle(payload.title);
  if (titleError) {
    return createError(titleError, "VALIDATION_ERROR");
  }

  if (!isPositiveNumber(payload.unitId)) {
    return createError("Invalid unit id", "VALIDATION_ERROR");
  }

  if (!hasOnlyPositiveNumbers(payload.questionIds)) {
    return createError("Question ids must contain only positive numbers", "VALIDATION_ERROR");
  }

  const response = await request<UnitReviewResponse>("/unit-reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (response.success) {
    clearCachePrefix("reviews:");
  }

  return response;
}

export async function updateUnitReview(
  id: number,
  payload: UnitReviewRequest,
): Promise<ApiResponse<UnitReviewResponse>> {
  if (!isPositiveNumber(id)) {
    return createError("Invalid review id", "VALIDATION_ERROR");
  }

  const titleError = validateTitle(payload.title);
  if (titleError) {
    return createError(titleError, "VALIDATION_ERROR");
  }

  if (!isPositiveNumber(payload.unitId)) {
    return createError("Invalid unit id", "VALIDATION_ERROR");
  }

  if (!hasOnlyPositiveNumbers(payload.questionIds)) {
    return createError("Question ids must contain only positive numbers", "VALIDATION_ERROR");
  }

  const response = await request<UnitReviewResponse>(`/unit-reviews/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  if (response.success) {
    clearCachePrefix("reviews:");
  }

  return response;
}

export async function getUnitReviews(): Promise<ApiResponse<UnitReviewResponse[]>> {
  return request<UnitReviewResponse[]>("/unit-reviews", {
    method: "GET",
  }, {
    key: "reviews:unit-reviews:list",
    ttlMs: 5 * 60 * 1000,
  });
}

export async function getUnitReviewById(
  id: number,
): Promise<ApiResponse<UnitReviewResponse>> {
  if (!isPositiveNumber(id)) {
    return createError("Invalid review id", "VALIDATION_ERROR");
  }

  return request<UnitReviewResponse>(`/unit-reviews/${id}`, {
    method: "GET",
  }, {
    key: `reviews:unit-reviews:${id}`,
    ttlMs: 5 * 60 * 1000,
  });
}

export async function createGroupReview(
  payload: GroupReviewRequest,
): Promise<ApiResponse<GroupReviewResponse>> {
  const titleError = validateTitle(payload.title);
  if (titleError) {
    return createError(titleError, "VALIDATION_ERROR");
  }

  const unitRangeError = validateUnitRange(payload.startUnit, payload.endUnit);
  if (unitRangeError) {
    return createError(unitRangeError, "VALIDATION_ERROR");
  }

  if (!isPositiveNumber(payload.gradeId)) {
    return createError("Invalid grade id", "VALIDATION_ERROR");
  }

  if (!hasOnlyPositiveNumbers(payload.questionIds)) {
    return createError("Question ids must contain only positive numbers", "VALIDATION_ERROR");
  }

  const response = await request<GroupReviewResponse>("/group-reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (response.success) {
    clearCachePrefix("reviews:");
  }

  return response;
}

export async function getGroupReviews(): Promise<ApiResponse<GroupReviewResponse[]>> {
  return request<GroupReviewResponse[]>("/group-reviews", {
    method: "GET",
  }, {
    key: "reviews:group-reviews:list",
    ttlMs: 5 * 60 * 1000,
  });
}

export async function getGroupReviewById(
  id: number,
): Promise<ApiResponse<GroupReviewResponse>> {
  if (!isPositiveNumber(id)) {
    return createError("Invalid group review id", "VALIDATION_ERROR");
  }

  return request<GroupReviewResponse>(`/group-reviews/${id}`, {
    method: "GET",
  }, {
    key: `reviews:group-reviews:${id}`,
    ttlMs: 5 * 60 * 1000,
  });
}

export async function updateGroupReview(
  id: number,
  payload: GroupReviewRequest,
): Promise<ApiResponse<GroupReviewResponse>> {
  if (!isPositiveNumber(id)) {
    return createError("Invalid group review id", "VALIDATION_ERROR");
  }

  const titleError = validateTitle(payload.title);
  if (titleError) {
    return createError(titleError, "VALIDATION_ERROR");
  }

  const unitRangeError = validateUnitRange(payload.startUnit, payload.endUnit);
  if (unitRangeError) {
    return createError(unitRangeError, "VALIDATION_ERROR");
  }

  if (!isPositiveNumber(payload.gradeId)) {
    return createError("Invalid grade id", "VALIDATION_ERROR");
  }

  if (!hasOnlyPositiveNumbers(payload.questionIds)) {
    return createError("Question ids must contain only positive numbers", "VALIDATION_ERROR");
  }

  const response = await request<GroupReviewResponse>(`/group-reviews/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  if (response.success) {
    clearCachePrefix("reviews:");
  }

  return response;
}

export async function createSemesterTest(
  payload: SemesterTestRequest,
): Promise<ApiResponse<SemesterTestResponse>> {
  const titleError = validateTitle(payload.title);
  if (titleError) {
    return createError(titleError, "VALIDATION_ERROR");
  }

  const unitRangeError = validateUnitRange(payload.startUnit, payload.endUnit);
  if (unitRangeError) {
    return createError(unitRangeError, "VALIDATION_ERROR");
  }

  if (!isPositiveNumber(payload.timeLimit)) {
    return createError("Invalid time limit", "VALIDATION_ERROR");
  }

  if (!isPositiveNumber(payload.gradeId)) {
    return createError("Invalid grade id", "VALIDATION_ERROR");
  }

  if (!hasOnlyPositiveNumbers(payload.questionGroupIds)) {
    return createError(
      "Question group ids must contain only positive numbers",
      "VALIDATION_ERROR",
    );
  }

  if (!hasOnlyPositiveNumbers(payload.questionIds)) {
    return createError("Question ids must contain only positive numbers", "VALIDATION_ERROR");
  }

  const response = await request<SemesterTestResponse>("/semester-tests", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (response.success) {
    clearCachePrefix("reviews:");
  }

  return response;
}

export async function getSemesterTests(): Promise<ApiResponse<SemesterTestResponse[]>> {
  return request<SemesterTestResponse[]>("/semester-tests", {
    method: "GET",
  }, {
    key: "reviews:semester-tests:list",
    ttlMs: 5 * 60 * 1000,
  });
}

export async function getSemesterTestById(
  id: number,
): Promise<ApiResponse<SemesterTestResponse>> {
  if (!isPositiveNumber(id)) {
    return createError("Invalid semester test id", "VALIDATION_ERROR");
  }

  return request<SemesterTestResponse>(`/semester-tests/${id}`, {
    method: "GET",
  }, {
    key: `reviews:semester-tests:${id}`,
    ttlMs: 5 * 60 * 1000,
  });
}

export async function updateSemesterTest(
  id: number,
  payload: SemesterTestRequest,
): Promise<ApiResponse<SemesterTestResponse>> {
  if (!isPositiveNumber(id)) {
    return createError("Invalid semester test id", "VALIDATION_ERROR");
  }

  const titleError = validateTitle(payload.title);
  if (titleError) {
    return createError(titleError, "VALIDATION_ERROR");
  }

  const unitRangeError = validateUnitRange(payload.startUnit, payload.endUnit);
  if (unitRangeError) {
    return createError(unitRangeError, "VALIDATION_ERROR");
  }

  if (!isPositiveNumber(payload.timeLimit)) {
    return createError("Invalid time limit", "VALIDATION_ERROR");
  }

  if (!isPositiveNumber(payload.gradeId)) {
    return createError("Invalid grade id", "VALIDATION_ERROR");
  }

  if (!hasOnlyPositiveNumbers(payload.questionGroupIds)) {
    return createError(
      "Question group ids must contain only positive numbers",
      "VALIDATION_ERROR",
    );
  }

  if (!hasOnlyPositiveNumbers(payload.questionIds)) {
    return createError("Question ids must contain only positive numbers", "VALIDATION_ERROR");
  }

  const response = await request<SemesterTestResponse>(`/semester-tests/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  if (response.success) {
    clearCachePrefix("reviews:");
  }

  return response;
}
