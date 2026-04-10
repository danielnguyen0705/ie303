export type SectionType =
  | "GETTING_STARTED"
  | "LANGUAGE"
  | "READING"
  | "SPEAKING"
  | "LISTENING"
  | "WRITING"
  | "COMMUNICATION_CULTURE_CLIL"
  | "LOOKING_BACK"
  | "UNIT_REVISION";

export type SkillType =
  | "VOCABULARY"
  | "GRAMMAR"
  | "READING"
  | "LISTENING"
  | "SPEAKING"
  | "WRITING";

/* =========================
   BASE API TYPES
========================= */
export class ApiError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

export interface AdminApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

/* =========================
   GRADE
========================= */
export interface Grade {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateGradeRequest {
  name: string;
  description?: string;
}

export interface UpdateGradeRequest {
  name?: string;
  description?: string;
}

export interface DeleteGradeRequest {
  id: number;
}

/* =========================
   UNIT
========================= */
export interface Unit {
  id: number;
  gradeId: number;
  name: string;
  description?: string;
  unitNumber?: number;
  orderIndex?: number;
  progress?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUnitRequest {
  gradeId: number;
  name: string;
  description?: string;
  unitNumber?: number;
  orderIndex?: number;
}

export interface UpdateUnitRequest {
  name?: string;
  description?: string;
  unitNumber?: number;
  orderIndex?: number;
  gradeId?: number;
}

export interface DeleteUnitRequest {
  id: number;
}

/* =========================
   SECTION
========================= */
export interface Section {
  id: number;
  unitId: number;
  name: string;
  description?: string;
  sectionNumber?: number;
  sectionType?: SectionType;
  orderIndex?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSectionRequest {
  unitId: number;
  name: string;
  description?: string;
  sectionNumber?: number;
  orderIndex?: number;
  sectionType?: SectionType;
}

export interface UpdateSectionRequest {
  name?: string;
  description?: string;
  sectionNumber?: number;
  orderIndex?: number;
  unitId?: number;
  sectionType?: SectionType;
}

export interface DeleteSectionRequest {
  id: number;
}

/* =========================
   LESSON
========================= */
export interface Lesson {
  id: number;
  sectionId: number;
  name: string;
  description?: string;
  lessonNumber?: number;
  skillType?: SkillType;
  isReviewLesson?: boolean;
  durationMinutes?: number;
  isVipOnly?: boolean;
  orderIndex?: number;
  completed?: boolean;
  unlocked?: boolean;
  current?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLessonRequest {
  sectionId: number;
  name: string;
  description?: string;
  lessonNumber?: number;
  orderIndex?: number;
  skillType?: SkillType;
  isReviewLesson?: boolean;
  durationMinutes?: number;
  isVipOnly?: boolean;
}

export interface UpdateLessonRequest {
  name?: string;
  description?: string;
  lessonNumber?: number;
  orderIndex?: number;
  sectionId?: number;
  skillType?: SkillType;
  isReviewLesson?: boolean;
  durationMinutes?: number;
  isVipOnly?: boolean;
}

export interface DeleteLessonRequest {
  id: number;
}

/* =========================
   QUESTION OPTION
========================= */
export interface QuestionOption {
  id: number;
  questionId: number;
  optionKey?: string;
  content: string;
  isCorrect?: boolean;
  explanation?: string;
  orderIndex?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateQuestionOptionRequest {
  questionId: number;
  optionKey?: string;
  content: string;
  isCorrect?: boolean;
  explanation?: string;
  orderIndex?: number;
}

export interface UpdateQuestionOptionRequest {
  questionId?: number;
  optionKey?: string;
  content?: string;
  isCorrect?: boolean;
  explanation?: string;
  orderIndex?: number;
}

/* =========================
   QUESTION GROUP
========================= */
export interface QuestionGroup {
  id: number;
  lessonId?: number;
  title?: string;
  description?: string;
  groupType?: string;
  orderIndex?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateQuestionGroupRequest {
  lessonId?: number;
  title?: string;
  description?: string;
  groupType?: string;
  orderIndex?: number;
}

export interface UpdateQuestionGroupRequest {
  lessonId?: number;
  title?: string;
  description?: string;
  groupType?: string;
  orderIndex?: number;
}

/* =========================
   QUESTION
========================= */
export interface Question {
  id: number;
  questionType: string;
  content?: string;
  instruction?: string;
  audioUrl?: string | null;
  imageUrl?: string | null;
  questionData?: string | null;
  explanation?: string | null;
  correctAnswer?: string | null;
  lessonId?: number;
  questionGroupId?: number | null;
  options?: QuestionOption[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateQuestionRequest {
  questionType: string;
  content?: string;
  instruction?: string;
  audioUrl?: string;
  imageUrl?: string;
  questionData?: string;
  explanation?: string;
  correctAnswer?: string;
  lessonId?: number;
  questionGroupId?: number | null;
}

export interface UpdateQuestionRequest {
  questionType?: string;
  content?: string;
  instruction?: string;
  audioUrl?: string;
  imageUrl?: string;
  questionData?: string;
  explanation?: string;
  correctAnswer?: string;
  lessonId?: number;
  questionGroupId?: number | null;
}

export interface DeleteQuestionRequest {
  id: number;
}

/* =========================
   LESSON QUESTION RESPONSE
========================= */
export interface LessonQuestionResponse {
  lessonId?: number;
  lessonName?: string;
  questions: Question[];
}