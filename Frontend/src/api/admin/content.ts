import { createError, request } from "../utils/http";
import type {
  AdminApiResponse,
  Grade,
  Unit,
  Section,
  Lesson,
  Question,
  QuestionOption,
  QuestionGroup,
  CreateGradeRequest,
  UpdateGradeRequest,
  DeleteGradeRequest,
  CreateUnitRequest,
  UpdateUnitRequest,
  DeleteUnitRequest,
  CreateSectionRequest,
  UpdateSectionRequest,
  DeleteSectionRequest,
  CreateLessonRequest,
  UpdateLessonRequest,
  DeleteLessonRequest,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  DeleteQuestionRequest,
  CreateQuestionOptionRequest,
  UpdateQuestionOptionRequest,
  CreateQuestionGroupRequest,
  UpdateQuestionGroupRequest,
  LessonQuestionResponse,
} from "./types";

type RawUnit = {
  id?: number;
  unitId?: number;
  gradeId?: number;
  title?: string;
  name?: string;
  description?: string;
  unitNumber?: number;
  orderIndex?: number;
  progress?: number;
  createdAt?: string;
  updatedAt?: string;
};

type RawSection = {
  id?: number;
  sectionId?: number;
  unitId?: number;
  title?: string;
  name?: string;
  sectionTitle?: string;
  sectionNumber?: number;
  sectionType?: string;
  orderIndex?: number;
  createdAt?: string;
  updatedAt?: string;
};

type RawLesson = {
  id?: number;
  lessonId?: number;
  sectionId?: number;
  title?: string;
  name?: string;
  lessonTitle?: string;
  lessonNumber?: number;
  orderIndex?: number;
  skillType?: string;
  isReviewLesson?: boolean;
  durationMinutes?: number;
  isVipOnly?: boolean;
  completed?: boolean;
  unlocked?: boolean;
  current?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

function mapResponseData<TIn, TOut>(
  response: AdminApiResponse<TIn>,
  mapper: (data: TIn) => TOut,
): AdminApiResponse<TOut> {
  if (!response.success || response.data === undefined) {
    return response as unknown as AdminApiResponse<TOut>;
  }

  return {
    ...response,
    data: mapper(response.data),
  };
}

function mapUnit(raw: RawUnit): Unit {
  return {
    id: raw.id ?? raw.unitId ?? 0,
    gradeId: raw.gradeId ?? 0,
    name: raw.name ?? raw.title ?? "",
    description: raw.description ?? "",
    unitNumber: raw.unitNumber ?? raw.orderIndex,
    orderIndex: raw.orderIndex ?? raw.unitNumber,
    progress: raw.progress,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function mapSection(raw: RawSection): Section {
  return {
    id: raw.id ?? raw.sectionId ?? 0,
    unitId: raw.unitId ?? 0,
    name: raw.name ?? raw.title ?? raw.sectionTitle ?? "",
    description: "",
    sectionNumber: raw.sectionNumber ?? raw.orderIndex,
    sectionType: raw.sectionType as Section["sectionType"],
    orderIndex: raw.orderIndex ?? raw.sectionNumber,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function mapLesson(raw: RawLesson): Lesson {
  return {
    id: raw.id ?? raw.lessonId ?? 0,
    sectionId: raw.sectionId ?? 0,
    name: raw.name ?? raw.title ?? raw.lessonTitle ?? "",
    description: "",
    lessonNumber: raw.lessonNumber ?? raw.orderIndex,
    orderIndex: raw.orderIndex ?? raw.lessonNumber,
    skillType: raw.skillType as Lesson["skillType"],
    isReviewLesson: raw.isReviewLesson,
    durationMinutes: raw.durationMinutes,
    isVipOnly: raw.isVipOnly,
    completed: raw.completed,
    unlocked: raw.unlocked,
    current: raw.current,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  } as Lesson;
}

function appendStringIfPresent(
  formData: FormData,
  key: string,
  value?: string | number | null,
) {
  if (value !== undefined && value !== null && String(value).trim() !== "") {
    formData.append(key, String(value));
  }
}

function appendMediaField(
  formData: FormData,
  key: string,
  value?: string | File | null,
) {
  if (value == null) return;

  if (value instanceof File) {
    formData.append(key, value);
    return;
  }

  if (typeof value === "string" && value.trim() !== "") {
    formData.append(key, value);
  }
}

/* =========================
   GRADE
========================= */
export async function getAllGrades(): Promise<AdminApiResponse<Grade[]>> {
  return request<Grade[]>("/grades", { method: "GET" });
}

export async function getGrade(params: {
  gradeId: number;
}): Promise<AdminApiResponse<Grade>> {
  if (!params.gradeId) {
    return createError("Grade id is required", "VALIDATION_ERROR");
  }

  return request<Grade>(`/grades/${params.gradeId}`, { method: "GET" });
}

export async function createGrade(
  payload: CreateGradeRequest,
): Promise<AdminApiResponse<Grade>> {
  if (!payload.name?.trim()) {
    return createError("Grade name is required", "VALIDATION_ERROR");
  }

  return request<Grade>("/grades", {
    method: "POST",
    body: JSON.stringify({
      name: payload.name.trim(),
      description: payload.description?.trim() || undefined,
    }),
  });
}

export async function updateGrade(params: {
  gradeId: number;
  data: UpdateGradeRequest;
}): Promise<AdminApiResponse<Grade>> {
  if (!params.gradeId) {
    return createError("Grade id is required", "VALIDATION_ERROR");
  }

  return request<Grade>(`/grades/${params.gradeId}`, {
    method: "PUT",
    body: JSON.stringify({
      name: params.data.name?.trim(),
      description: params.data.description?.trim() || undefined,
    }),
  });
}

export async function deleteGrade(
  payload: DeleteGradeRequest,
): Promise<AdminApiResponse<boolean>> {
  if (!payload.id) {
    return createError("Grade id is required", "VALIDATION_ERROR");
  }

  return request<boolean>(`/grades/${payload.id}`, { method: "DELETE" });
}

/* =========================
   UNIT
========================= */
export async function getAllUnits(): Promise<AdminApiResponse<Unit[]>> {
  const response = await request<RawUnit[]>("/units", { method: "GET" });
  return mapResponseData(response, (items) => items.map(mapUnit));
}

export async function getUnitsByGrade(params: {
  gradeId: number;
}): Promise<AdminApiResponse<Unit[]>> {
  if (!params.gradeId) {
    return createError("Grade id is required", "VALIDATION_ERROR");
  }

  const response = await request<RawUnit[]>("/units", { method: "GET" });

  return mapResponseData(response, (items) =>
    items.map(mapUnit).filter((unit) => unit.gradeId === params.gradeId),
  );
}

export async function getUnit(params: {
  unitId: number;
}): Promise<AdminApiResponse<Unit>> {
  if (!params.unitId) {
    return createError("Unit id is required", "VALIDATION_ERROR");
  }

  const response = await request<RawUnit>(`/units/${params.unitId}`, {
    method: "GET",
  });

  return mapResponseData(response, mapUnit);
}

export async function createUnit(
  payload: CreateUnitRequest,
): Promise<AdminApiResponse<Unit>> {
  if (!payload.gradeId) {
    return createError("Grade id is required", "VALIDATION_ERROR");
  }

  if (!payload.name?.trim()) {
    return createError("Unit name is required", "VALIDATION_ERROR");
  }

  const safeUnitNumber =
    payload.unitNumber && payload.unitNumber > 0 ? payload.unitNumber : 1;

  const safeOrderIndex =
    payload.orderIndex && payload.orderIndex > 0
      ? payload.orderIndex
      : safeUnitNumber;

  const response = await request<RawUnit>("/units", {
    method: "POST",
    body: JSON.stringify({
      unitNumber: safeUnitNumber,
      title: payload.name.trim(),
      description: payload.description?.trim() || undefined,
      orderIndex: safeOrderIndex,
      gradeId: payload.gradeId,
    }),
  });

  return mapResponseData(response, mapUnit);
}

export async function updateUnit(params: {
  unitId: number;
  data: UpdateUnitRequest & { gradeId?: number; unitNumber?: number };
}): Promise<AdminApiResponse<Unit>> {
  if (!params.unitId) {
    return createError("Unit id is required", "VALIDATION_ERROR");
  }

  const safeUnitNumber =
    params.data.unitNumber && params.data.unitNumber > 0
      ? params.data.unitNumber
      : undefined;

  const safeOrderIndex =
    params.data.orderIndex && params.data.orderIndex > 0
      ? params.data.orderIndex
      : safeUnitNumber;

  const response = await request<RawUnit>(`/units/${params.unitId}`, {
    method: "PUT",
    body: JSON.stringify({
      unitNumber: safeUnitNumber,
      title: params.data.name?.trim(),
      description: params.data.description?.trim() || undefined,
      orderIndex: safeOrderIndex,
      gradeId: params.data.gradeId,
    }),
  });

  return mapResponseData(response, mapUnit);
}

export async function deleteUnit(
  payload: DeleteUnitRequest,
): Promise<AdminApiResponse<boolean>> {
  if (!payload.id) {
    return createError("Unit id is required", "VALIDATION_ERROR");
  }

  return request<boolean>(`/units/${payload.id}`, { method: "DELETE" });
}

/* =========================
   SECTION
========================= */
export async function getSectionsByUnit(params: {
  unitId: number;
}): Promise<AdminApiResponse<Section[]>> {
  if (!params.unitId) {
    return createError("Unit id is required", "VALIDATION_ERROR");
  }

  const response = await request<RawSection[]>(
    `/progress/units/${params.unitId}/sections`,
    { method: "GET" },
  );

  return mapResponseData(response, (items) => items.map(mapSection));
}

export async function getSection(params: {
  sectionId: number;
}): Promise<AdminApiResponse<Section>> {
  if (!params.sectionId) {
    return createError("Section id is required", "VALIDATION_ERROR");
  }

  const response = await request<RawSection>(`/sections/${params.sectionId}`, {
    method: "GET",
  });

  return mapResponseData(response, mapSection);
}

export async function createSection(
  payload: CreateSectionRequest,
): Promise<AdminApiResponse<Section>> {
  if (!payload.unitId) {
    return createError("Unit id is required", "VALIDATION_ERROR");
  }

  if (!payload.name?.trim()) {
    return createError("Section name is required", "VALIDATION_ERROR");
  }

  if (!payload.sectionType) {
    return createError("Section type is required", "VALIDATION_ERROR");
  }

  const safeSectionNumber =
    payload.sectionNumber && payload.sectionNumber > 0
      ? payload.sectionNumber
      : 1;

  const safeOrderIndex =
    payload.orderIndex && payload.orderIndex > 0
      ? payload.orderIndex
      : safeSectionNumber;

  const response = await request<RawSection>("/sections", {
    method: "POST",
    body: JSON.stringify({
      sectionNumber: safeSectionNumber,
      title: payload.name.trim(),
      sectionType: payload.sectionType,
      orderIndex: safeOrderIndex,
      unitId: payload.unitId,
    }),
  });

  return mapResponseData(response, mapSection);
}

export async function updateSection(params: {
  sectionId: number;
  data: UpdateSectionRequest;
}): Promise<AdminApiResponse<Section>> {
  if (!params.sectionId) {
    return createError("Section id is required", "VALIDATION_ERROR");
  }

  if (!params.data.sectionType) {
    return createError("Section type is required", "VALIDATION_ERROR");
  }

  const response = await request<RawSection>(`/sections/${params.sectionId}`, {
    method: "PUT",
    body: JSON.stringify({
      sectionNumber: params.data.sectionNumber,
      title: params.data.name?.trim(),
      sectionType: params.data.sectionType,
      orderIndex: params.data.orderIndex,
      unitId: params.data.unitId,
    }),
  });

  return mapResponseData(response, mapSection);
}

export async function deleteSection(
  payload: DeleteSectionRequest,
): Promise<AdminApiResponse<boolean>> {
  if (!payload.id) {
    return createError("Section id is required", "VALIDATION_ERROR");
  }

  return request<boolean>(`/sections/${payload.id}`, { method: "DELETE" });
}

/* =========================
   LESSON
========================= */
export async function getLessonsBySection(params: {
  sectionId: number;
}): Promise<AdminApiResponse<Lesson[]>> {
  if (!params.sectionId) {
    return createError("Section id is required", "VALIDATION_ERROR");
  }

  const response = await request<RawLesson[]>(
    `/progress/sections/${params.sectionId}/lessons`,
    { method: "GET" },
  );

  return mapResponseData(response, (items) => items.map(mapLesson));
}

export async function getLesson(params: {
  lessonId: number;
}): Promise<AdminApiResponse<Lesson>> {
  if (!params.lessonId) {
    return createError("Lesson id is required", "VALIDATION_ERROR");
  }

  const response = await request<RawLesson>(`/lessons/${params.lessonId}`, {
    method: "GET",
  });

  return mapResponseData(response, mapLesson);
}

export async function createLesson(
  payload: CreateLessonRequest,
): Promise<AdminApiResponse<Lesson>> {
  if (!payload.sectionId) {
    return createError("Section id is required", "VALIDATION_ERROR");
  }

  if (!payload.name?.trim()) {
    return createError("Lesson name is required", "VALIDATION_ERROR");
  }

  if (!payload.skillType) {
    return createError("Lesson skill type is required", "VALIDATION_ERROR");
  }

  if (!payload.durationMinutes || payload.durationMinutes <= 0) {
    return createError("Lesson durationMinutes is required", "VALIDATION_ERROR");
  }

  const safeLessonNumber =
    payload.lessonNumber && payload.lessonNumber > 0 ? payload.lessonNumber : 1;

  const safeOrderIndex =
    payload.orderIndex && payload.orderIndex > 0
      ? payload.orderIndex
      : safeLessonNumber;

  const response = await request<RawLesson>("/lessons", {
    method: "POST",
    body: JSON.stringify({
      lessonNumber: safeLessonNumber,
      title: payload.name.trim(),
      skillType: payload.skillType,
      isReviewLesson: payload.isReviewLesson ?? false,
      durationMinutes: payload.durationMinutes,
      isVipOnly: payload.isVipOnly ?? false,
      orderIndex: safeOrderIndex,
      sectionId: payload.sectionId,
    }),
  });

  return mapResponseData(response, mapLesson);
}

export async function updateLesson(params: {
  lessonId: number;
  data: UpdateLessonRequest;
}): Promise<AdminApiResponse<Lesson>> {
  if (!params.lessonId) {
    return createError("Lesson id is required", "VALIDATION_ERROR");
  }

  if (!params.data.skillType) {
    return createError("Lesson skill type is required", "VALIDATION_ERROR");
  }

  if (!params.data.durationMinutes || params.data.durationMinutes <= 0) {
    return createError("Lesson durationMinutes is required", "VALIDATION_ERROR");
  }

  const response = await request<RawLesson>(`/lessons/${params.lessonId}`, {
    method: "PUT",
    body: JSON.stringify({
      lessonNumber: params.data.lessonNumber,
      title: params.data.name?.trim(),
      skillType: params.data.skillType,
      isReviewLesson: params.data.isReviewLesson ?? false,
      durationMinutes: params.data.durationMinutes,
      isVipOnly: params.data.isVipOnly ?? false,
      orderIndex: params.data.orderIndex,
      sectionId: params.data.sectionId,
    }),
  });

  return mapResponseData(response, mapLesson);
}

export async function deleteLesson(
  payload: DeleteLessonRequest,
): Promise<AdminApiResponse<boolean>> {
  if (!payload.id) {
    return createError("Lesson id is required", "VALIDATION_ERROR");
  }

  return request<boolean>(`/lessons/${payload.id}`, { method: "DELETE" });
}

/* =========================
   QUESTION
========================= */
export async function getQuestionsByLesson(params: {
  lessonId: number;
}): Promise<AdminApiResponse<LessonQuestionResponse>> {
  if (!params.lessonId) {
    return createError("Lesson id is required", "VALIDATION_ERROR");
  }

  return request<LessonQuestionResponse>(
    `/questions/lesson/${params.lessonId}`,
    {
      method: "GET",
    },
  );
}

export async function getQuestion(params: {
  questionId: number;
}): Promise<AdminApiResponse<Question>> {
  if (!params.questionId) {
    return createError("Question id is required", "VALIDATION_ERROR");
  }

  return request<Question>(`/questions/${params.questionId}`, {
    method: "GET",
  });
}

export async function createQuestion(
  payload: CreateQuestionRequest & { correctAnswer?: string },
): Promise<AdminApiResponse<Question>> {
  if (!payload.lessonId) {
    return createError("Lesson id is required", "VALIDATION_ERROR");
  }

  if (!payload.questionType) {
    return createError("Question type is required", "VALIDATION_ERROR");
  }

  const formData = new FormData();

  appendStringIfPresent(formData, "questionType", payload.questionType);
  appendStringIfPresent(formData, "content", payload.content);
  appendStringIfPresent(formData, "instruction", payload.instruction);
  appendStringIfPresent(formData, "questionData", payload.questionData);
  appendStringIfPresent(formData, "explanation", payload.explanation);
  appendStringIfPresent(formData, "correctAnswer", payload.correctAnswer);
  appendStringIfPresent(formData, "lessonId", payload.lessonId);
  appendStringIfPresent(formData, "questionGroupId", payload.questionGroupId);

  appendMediaField(formData, "audioUrl", payload.audioUrl);
  appendMediaField(formData, "imageUrl", payload.imageUrl);

  return request<Question>("/questions", {
    method: "POST",
    body: formData,
    headers: {},
  });
}

export async function updateQuestion(params: {
  questionId: number;
  data: UpdateQuestionRequest & { correctAnswer?: string };
}): Promise<AdminApiResponse<Question>> {
  if (!params.questionId) {
    return createError("Question id is required", "VALIDATION_ERROR");
  }

  const formData = new FormData();

  appendStringIfPresent(formData, "questionType", params.data.questionType);
  appendStringIfPresent(formData, "content", params.data.content);
  appendStringIfPresent(formData, "instruction", params.data.instruction);
  appendStringIfPresent(formData, "questionData", params.data.questionData);
  appendStringIfPresent(formData, "explanation", params.data.explanation);
  appendStringIfPresent(formData, "correctAnswer", params.data.correctAnswer);
  appendStringIfPresent(formData, "lessonId", params.data.lessonId);
  appendStringIfPresent(formData, "questionGroupId", params.data.questionGroupId);

  appendMediaField(formData, "audioUrl", params.data.audioUrl);
  appendMediaField(formData, "imageUrl", params.data.imageUrl);

  return request<Question>(`/questions/${params.questionId}`, {
    method: "PUT",
    body: formData,
    headers: {},
  });
}

export async function deleteQuestion(
  payload: DeleteQuestionRequest,
): Promise<AdminApiResponse<boolean>> {
  if (!payload.id) {
    return createError("Question id is required", "VALIDATION_ERROR");
  }

  return request<boolean>(`/questions/${payload.id}`, { method: "DELETE" });
}

/* =========================
   QUESTION OPTION
========================= */
export async function createQuestionOption(
  payload: CreateQuestionOptionRequest,
): Promise<AdminApiResponse<QuestionOption>> {
  return request<QuestionOption>("/question-options", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateQuestionOption(params: {
  optionId: number;
  data: UpdateQuestionOptionRequest;
}): Promise<AdminApiResponse<QuestionOption>> {
  return request<QuestionOption>(`/question-options/${params.optionId}`, {
    method: "PUT",
    body: JSON.stringify(params.data),
  });
}

export async function deleteQuestionOption(payload: {
  id?: number;
  optionId?: number;
}): Promise<AdminApiResponse<boolean>> {
  const id = payload.id ?? payload.optionId;
  return request<boolean>(`/question-options/${id}`, { method: "DELETE" });
}

/* =========================
   QUESTION GROUP
========================= */
export async function createQuestionGroup(
  payload: CreateQuestionGroupRequest,
): Promise<AdminApiResponse<QuestionGroup>> {
  return request<QuestionGroup>("/question-groups", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateQuestionGroup(params: {
  groupId: number;
  data: UpdateQuestionGroupRequest;
}): Promise<AdminApiResponse<QuestionGroup>> {
  return request<QuestionGroup>(`/question-groups/${params.groupId}`, {
    method: "PUT",
    body: JSON.stringify(params.data),
  });
}

export async function deleteQuestionGroup(payload: {
  id?: number;
  groupId?: number;
}): Promise<AdminApiResponse<boolean>> {
  const id = payload.id ?? payload.groupId;
  return request<boolean>(`/question-groups/${id}`, { method: "DELETE" });
}