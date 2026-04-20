import { getLessonById, getQuestionById, getQuestionGroupById } from "@/api";
import type { QuestionDto, QuestionGroupDto } from "@/api/questions";

type QuestionBundleParams = {
  questionIds?: number[];
  questionGroupIds?: number[];
  includeVipLessons?: boolean;
};

function sortById(values: Iterable<number>) {
  return Array.from(new Set(values)).sort((left, right) => left - right);
}

export function hasVipAccess(user: unknown) {
  if (!user || typeof user !== "object") {
    return false;
  }

  const candidate = user as {
    isVip?: boolean;
    vipStatus?: string;
    vipExpiredAt?: string | null;
  };

  if (candidate.isVip) {
    return true;
  }

  if (candidate.vipStatus && candidate.vipStatus !== "free") {
    return true;
  }

  if (!candidate.vipExpiredAt) {
    return false;
  }

  const expiredAt = new Date(candidate.vipExpiredAt);
  return !Number.isNaN(expiredAt.getTime()) && expiredAt.getTime() > Date.now();
}

export async function loadQuestionBundle({
  questionIds = [],
  questionGroupIds = [],
  includeVipLessons = false,
}: QuestionBundleParams): Promise<{
  questions: QuestionDto[];
  questionGroups: Record<number, QuestionGroupDto>;
}> {
  const explicitGroupIds = sortById(questionGroupIds.filter(Boolean));

  const explicitGroupResponses = await Promise.all(
    explicitGroupIds.map((questionGroupId) => getQuestionGroupById(questionGroupId)),
  );

  const questionGroups: Record<number, QuestionGroupDto> = {};
  const orderedQuestions: QuestionDto[] = [];
  const seenQuestionIds = new Set<number>();

  for (const response of explicitGroupResponses) {
    if (!response.success || !response.data) continue;

    questionGroups[response.data.id] = response.data;
    for (const question of response.data.questions ?? []) {
      if (!seenQuestionIds.has(question.id)) {
        orderedQuestions.push(question);
        seenQuestionIds.add(question.id);
      }
    }
  }

  const questionResponses = await Promise.all(
    sortById(questionIds.filter(Boolean)).map((questionId) => getQuestionById(questionId)),
  );

  const singleQuestions = questionResponses
    .filter((response) => response.success && response.data)
    .map((response) => response.data as QuestionDto);

  const nestedGroupIds = sortById(
    singleQuestions
      .map((question) => question.questionGroupId)
      .filter(
        (questionGroupId): questionGroupId is number =>
          typeof questionGroupId === "number" && !questionGroups[questionGroupId],
      ),
  );

  const nestedGroupResponses = await Promise.all(
    nestedGroupIds.map((questionGroupId) => getQuestionGroupById(questionGroupId)),
  );

  for (const response of nestedGroupResponses) {
    if (response.success && response.data) {
      questionGroups[response.data.id] = response.data;
    }
  }

  for (const question of singleQuestions) {
    if (!seenQuestionIds.has(question.id)) {
      orderedQuestions.push(question);
      seenQuestionIds.add(question.id);
    }
  }

  if (includeVipLessons) {
    return {
      questions: orderedQuestions,
      questionGroups,
    };
  }

  const lessonIds = sortById([
    ...orderedQuestions
      .map((question) => question.lessonId)
      .filter((lessonId): lessonId is number => typeof lessonId === "number"),
    ...Object.values(questionGroups)
      .map((group) => group.lessonId)
      .filter((lessonId): lessonId is number => typeof lessonId === "number"),
  ]);

  const lessonResponses = await Promise.all(
    lessonIds.map((lessonId) => getLessonById(lessonId)),
  );

  const allowedLessonIds = new Set<number>();
  for (const response of lessonResponses) {
    if (!response.success || !response.data?.id) continue;

    if (!response.data.isVipOnly) {
      allowedLessonIds.add(response.data.id);
    }
  }

  const filteredQuestions = orderedQuestions.filter(
    (question) =>
      typeof question.lessonId === "number" && allowedLessonIds.has(question.lessonId),
  );

  const remainingQuestionIds = new Set(filteredQuestions.map((question) => question.id));
  const filteredGroups = Object.values(questionGroups).reduce<Record<number, QuestionGroupDto>>(
    (acc, group) => {
      if (typeof group.lessonId !== "number" || !allowedLessonIds.has(group.lessonId)) {
        return acc;
      }

      const filteredGroupQuestions = (group.questions ?? []).filter((question) =>
        remainingQuestionIds.has(question.id),
      );

      if (filteredGroupQuestions.length === 0) {
        return acc;
      }

      acc[group.id] = {
        ...group,
        questions: filteredGroupQuestions,
      };

      return acc;
    },
    {},
  );

  return {
    questions: filteredQuestions,
    questionGroups: filteredGroups,
  };
}
