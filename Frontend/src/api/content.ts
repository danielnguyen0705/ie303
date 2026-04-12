export type SkillType =
  | "VOCABULARY"
  | "GRAMMAR"
  | "READING"
  | "LISTENING"
  | "SPEAKING"
  | "WRITING";

export type QuestionType =
  | "MULTIPLE_CHOICE"
  | "FILL_IN_BLANK"
  | "READING"
  | "LISTENING"
  | "PRONUNCIATION"
  | "MATCHING"
  | "REORDER"
  | "TRUE_FALSE"
  | "WRITING"
  | "SPEAKING";

export interface Grade {
  id: number;
  gradeNumber?: number;
  title: string;
  description?: string;
  totalUnits?: number;
  progress?: number;
}

export interface Unit {
  id: number;
  unitNumber?: number;
  title: string;
  description?: string;
  gradeId?: number;
  progress?: number;
  totalSections?: number;
}

export interface Section {
  id: number;
  sectionNumber?: number;
  title: string;
  description?: string;
  unitId?: number;
  skillType?: SkillType;
  progress?: number;
  totalLessons?: number;
}

export interface Lesson {
  id: number;
  lessonNumber?: number;
  title: string;
  description?: string;
  sectionId?: number;
  skillType?: SkillType;
  isVipOnly?: boolean;
  progress?: number;
}

export interface QuestionOption {
  id: number;
  content: string;
  isCorrect?: boolean;
}

export interface Question {
  id: number;
  questionText: string;
  correctAnswer?: string;
  explanation?: string;
  type: QuestionType;
  lessonId?: number;
  questionGroupId?: number | null;
  options?: QuestionOption[];
  audioUrl?: string;
  imageUrl?: string;
  orderIndex?: number;
}

export interface QuestionGroup {
  id: number;
  title?: string;
  instruction?: string;
  content?: string;
  type?: QuestionType;
  lessonId?: number;
  questions?: Question[];
}

export interface LessonDetail {
  lesson: Lesson;
  questionGroups: QuestionGroup[];
  questions: Question[];
}