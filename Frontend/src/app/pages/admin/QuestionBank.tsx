import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  FolderTree,
  HelpCircle,
  Layers3,
  Loader2,
  Search,
} from "lucide-react";
import { adminApi } from "@/api";
import type {
  Grade,
  Lesson,
  LessonQuestionResponse,
  Question,
  QuestionGroup,
  Section,
  Unit,
} from "@/api/admin/types";

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function getQuestionTypeLabel(type?: string) {
  switch (type) {
    case "QUALITATIVE_MC":
      return "Qualitative MC";
    case "READING_MC":
      return "Reading MC";
    case "CLOZE_MC":
      return "Cloze MC";
    case "TRUE_FALSE_NG":
      return "True / False / Not Given";
    case "WORD_BANK_FILL":
      return "Word Bank Fill";
    case "LIMITED_FILL":
      return "Limited Fill";
    case "WORD_FORM":
      return "Word Form";
    case "VERB_FORM":
      return "Verb Form";
    case "SENTENCE_REORDER":
      return "Sentence Reorder";
    case "SENTENCE_REWRITE":
      return "Sentence Rewrite";
    case "ESSAY_WRITING":
      return "Essay Writing";
    case "MATCHING":
      return "Matching";
    case "PRONUNCIATION":
      return "Pronunciation";
    case "TOPIC_SPEAKING":
      return "Topic Speaking";
    case "READING_PASSAGE":
      return "Reading Passage Group";
    case "LISTENING_PASSAGE":
      return "Listening Passage Group";
    case "CLOZE_PASSAGE":
      return "Cloze Passage Group";
    case "WORD_BANK":
      return "Word Bank Group";
    case "WRITING_TASK":
      return "Writing Task Group";
    case "SPEAKING_TASK":
      return "Speaking Task Group";
    default:
      return type || "Unknown";
  }
}

function getQuestionPreview(question: Question) {
  return question.content?.trim() || question.instruction?.trim() || `Question #${question.id}`;
}

function getQuestionBankStats(payload?: LessonQuestionResponse | null) {
  const singleCount = payload?.singleQuestions?.length || 0;
  const groupCount = payload?.questionGroups?.length || 0;
  const childCount =
    payload?.questionGroups?.reduce(
      (sum, group) => sum + (group.questions?.length || 0),
      0,
    ) || 0;

  return {
    totalQuestions: singleCount + childCount,
    singleCount,
    groupCount,
    childCount,
  };
}

function questionMatchesSearch(question: Question, normalizedSearch: string) {
  if (!normalizedSearch) return true;

  return [
    question.content,
    question.instruction,
    question.questionType,
    question.correctAnswer,
    question.explanation,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedSearch));
}

function questionGroupMatchesSearch(group: QuestionGroup, normalizedSearch: string) {
  if (!normalizedSearch) return true;

  const ownFields = [
    group.groupType,
    group.title,
    group.instruction,
    group.sharedContent,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedSearch));

  return ownFields || (group.questions || []).some((question) => questionMatchesSearch(question, normalizedSearch));
}

function treeNodeMatchesSearch(
  normalizedSearch: string,
  fields: Array<string | number | undefined | null>,
) {
  if (!normalizedSearch) return true;

  return fields
    .filter((value) => value != null)
    .some((value) => String(value).toLowerCase().includes(normalizedSearch));
}

export function QuestionBank() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [unitsByGrade, setUnitsByGrade] = useState<Record<number, Unit[]>>({});
  const [sectionsByUnit, setSectionsByUnit] = useState<Record<number, Section[]>>({});
  const [lessonsBySection, setLessonsBySection] = useState<Record<number, Lesson[]>>({});
  const [questionsByLesson, setQuestionsByLesson] = useState<Record<number, LessonQuestionResponse>>({});

  const [expandedGrades, setExpandedGrades] = useState<Record<number, boolean>>({});
  const [expandedUnits, setExpandedUnits] = useState<Record<number, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});
  const [expandedLessons, setExpandedLessons] = useState<Record<number, boolean>>({});
  const [expandedTypeKeys, setExpandedTypeKeys] = useState<Record<string, boolean>>({});
  const [expandedGroupKeys, setExpandedGroupKeys] = useState<Record<string, boolean>>({});

  const [loading, setLoading] = useState(true);
  const [loadingKeys, setLoadingKeys] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const normalizedSearch = useMemo(() => normalizeSearch(searchTerm), [searchTerm]);

  useEffect(() => {
    void loadGrades();
  }, []);

  const setNodeLoading = (key: string, value: boolean) => {
    setLoadingKeys((prev) => ({ ...prev, [key]: value }));
  };

  const loadGrades = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminApi.getAllGrades();

      if (!response.success) {
        setError(response.error?.message || "Failed to load grades");
        return;
      }

      setGrades(response.data ?? []);
    } catch (err) {
      console.error("Error loading grades:", err);
      setError("Failed to load grades");
    } finally {
      setLoading(false);
    }
  };

  const loadUnits = async (gradeId: number) => {
    if (unitsByGrade[gradeId]) return;

    const key = `grade-${gradeId}`;
    try {
      setNodeLoading(key, true);
      const response = await adminApi.getUnitsByGrade({ gradeId });
      if (response.success) {
        setUnitsByGrade((prev) => ({ ...prev, [gradeId]: response.data ?? [] }));
      }
    } catch (err) {
      console.error("Error loading units:", err);
    } finally {
      setNodeLoading(key, false);
    }
  };

  const loadSections = async (unitId: number) => {
    if (sectionsByUnit[unitId]) return;

    const key = `unit-${unitId}`;
    try {
      setNodeLoading(key, true);
      const response = await adminApi.getSectionsByUnit({ unitId });
      if (response.success) {
        setSectionsByUnit((prev) => ({ ...prev, [unitId]: response.data ?? [] }));
      }
    } catch (err) {
      console.error("Error loading sections:", err);
    } finally {
      setNodeLoading(key, false);
    }
  };

  const loadLessons = async (sectionId: number) => {
    if (lessonsBySection[sectionId]) return;

    const key = `section-${sectionId}`;
    try {
      setNodeLoading(key, true);
      const response = await adminApi.getLessonsBySection({ sectionId });
      if (response.success) {
        setLessonsBySection((prev) => ({ ...prev, [sectionId]: response.data ?? [] }));
      }
    } catch (err) {
      console.error("Error loading lessons:", err);
    } finally {
      setNodeLoading(key, false);
    }
  };

  const loadQuestions = async (lessonId: number) => {
    if (questionsByLesson[lessonId]) return;

    const key = `lesson-${lessonId}`;
    try {
      setNodeLoading(key, true);
      const response = await adminApi.getQuestionsByLesson({ lessonId });
      if (response.success && response.data) {
        setQuestionsByLesson((prev) => ({ ...prev, [lessonId]: response.data! }));
      }
    } catch (err) {
      console.error("Error loading questions:", err);
    } finally {
      setNodeLoading(key, false);
    }
  };

  const toggleGrade = async (gradeId: number) => {
    const nextExpanded = !expandedGrades[gradeId];
    setExpandedGrades((prev) => ({ ...prev, [gradeId]: nextExpanded }));
    if (nextExpanded) {
      await loadUnits(gradeId);
    }
  };

  const toggleUnit = async (unitId: number) => {
    const nextExpanded = !expandedUnits[unitId];
    setExpandedUnits((prev) => ({ ...prev, [unitId]: nextExpanded }));
    if (nextExpanded) {
      await loadSections(unitId);
    }
  };

  const toggleSection = async (sectionId: number) => {
    const nextExpanded = !expandedSections[sectionId];
    setExpandedSections((prev) => ({ ...prev, [sectionId]: nextExpanded }));
    if (nextExpanded) {
      await loadLessons(sectionId);
    }
  };

  const toggleLesson = async (lessonId: number) => {
    const nextExpanded = !expandedLessons[lessonId];
    setExpandedLessons((prev) => ({ ...prev, [lessonId]: nextExpanded }));
    if (nextExpanded) {
      await loadQuestions(lessonId);
    }
  };

  const toggleType = (key: string) => {
    setExpandedTypeKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleGroup = (key: string) => {
    setExpandedGroupKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#155ca5]" />
          <p className="font-medium text-gray-600">Loading question bank...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-bold text-red-600">{error}</p>
        <button
          onClick={() => void loadGrades()}
          className="mt-4 rounded-md bg-red-600 px-6 py-2 font-bold text-white transition-colors hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#155ca5]">
            <FolderTree className="h-5 w-5" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">
              Content Based Browser
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Question Bank</h1>
          <p className="max-w-3xl text-sm text-slate-500">
            Xem câu hỏi theo cây content thật: lớp, unit, section, lesson, loại câu và nội dung câu hỏi.
          </p>
        </div>

        <div className="w-full max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên lesson, loại câu, nội dung câu hỏi..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-4 outline-none transition focus:border-[#155ca5] focus:ring-2 focus:ring-[#155ca5]/10"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {grades
          .filter((grade) =>
            treeNodeMatchesSearch(normalizedSearch, [grade.name, grade.description]),
          )
          .map((grade) => {
            const gradeLoading = loadingKeys[`grade-${grade.id}`];
            const units = unitsByGrade[grade.id] ?? [];

            return (
              <div
                key={grade.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                <button
                  onClick={() => void toggleGrade(grade.id)}
                  className="flex w-full items-center justify-between gap-3 px-6 py-5 text-left transition hover:bg-slate-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {expandedGrades[grade.id] ? (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    )}
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef5ff] text-[#155ca5]">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#155ca5]">
                        Grade
                      </p>
                      <h2 className="truncate text-lg font-black text-slate-900">
                        {grade.name}
                      </h2>
                      {grade.description && (
                        <p className="mt-1 text-sm text-slate-500">{grade.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-xs text-slate-500">
                    {gradeLoading ? "Loading units..." : `${units.length} units loaded`}
                  </div>
                </button>

                {expandedGrades[grade.id] && (
                  <div className="border-t border-slate-100 bg-slate-50/80 p-4">
                    {gradeLoading ? (
                      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading units...
                      </div>
                    ) : units.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                        Chưa có unit trong grade này.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {units
                          .filter((unit) =>
                            treeNodeMatchesSearch(normalizedSearch, [
                              unit.name,
                              unit.description,
                              unit.unitNumber,
                            ]),
                          )
                          .map((unit) => {
                            const unitLoading = loadingKeys[`unit-${unit.id}`];
                            const sections = sectionsByUnit[unit.id] ?? [];

                            return (
                              <div
                                key={unit.id}
                                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                              >
                                <button
                                  onClick={() => void toggleUnit(unit.id)}
                                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-slate-50"
                                >
                                  <div className="flex min-w-0 items-center gap-3">
                                    {expandedUnits[unit.id] ? (
                                      <ChevronDown className="h-4 w-4 text-slate-400" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-slate-400" />
                                    )}
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                        Unit
                                      </p>
                                      <p className="truncate font-bold text-slate-900">
                                        {unit.name}
                                      </p>
                                    </div>
                                  </div>

                                  <span className="text-xs text-slate-500">
                                    {unitLoading ? "Loading sections..." : `${sections.length} sections`}
                                  </span>
                                </button>

                                {expandedUnits[unit.id] && (
                                  <div className="border-t border-slate-100 bg-slate-50 p-4">
                                    {unitLoading ? (
                                      <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading sections...
                                      </div>
                                    ) : sections.length === 0 ? (
                                      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                                        Chưa có section.
                                      </div>
                                    ) : (
                                      <div className="space-y-3">
                                        {sections
                                          .filter((section) =>
                                            treeNodeMatchesSearch(normalizedSearch, [
                                              section.name,
                                              section.description,
                                              section.sectionType,
                                            ]),
                                          )
                                          .map((section) => {
                                            const sectionLoading = loadingKeys[`section-${section.id}`];
                                            const lessons = lessonsBySection[section.id] ?? [];

                                            return (
                                              <div
                                                key={section.id}
                                                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                                              >
                                                <button
                                                  onClick={() => void toggleSection(section.id)}
                                                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-slate-50"
                                                >
                                                  <div className="flex min-w-0 items-center gap-3">
                                                    {expandedSections[section.id] ? (
                                                      <ChevronDown className="h-4 w-4 text-slate-400" />
                                                    ) : (
                                                      <ChevronRight className="h-4 w-4 text-slate-400" />
                                                    )}
                                                    <div className="min-w-0">
                                                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                                        Section
                                                      </p>
                                                      <p className="truncate font-bold text-slate-900">
                                                        {section.name}
                                                      </p>
                                                    </div>
                                                  </div>

                                                  <span className="text-xs text-slate-500">
                                                    {sectionLoading ? "Loading lessons..." : `${lessons.length} lessons`}
                                                  </span>
                                                </button>

                                                {expandedSections[section.id] && (
                                                  <div className="border-t border-slate-100 bg-slate-50 p-4">
                                                    {sectionLoading ? (
                                                      <div className="flex items-center gap-2 text-sm text-slate-500">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Loading lessons...
                                                      </div>
                                                    ) : lessons.length === 0 ? (
                                                      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                                                        Chưa có lesson.
                                                      </div>
                                                    ) : (
                                                      <div className="space-y-3">
                                                        {lessons
                                                          .filter((lesson) =>
                                                            treeNodeMatchesSearch(normalizedSearch, [
                                                              lesson.name,
                                                              lesson.description,
                                                              lesson.skillType,
                                                            ]),
                                                          )
                                                          .map((lesson) => {
                                                            const lessonKey = `lesson-${lesson.id}`;
                                                            const lessonLoading = loadingKeys[lessonKey];
                                                            const questionPayload = questionsByLesson[lesson.id];
                                                            const stats = getQuestionBankStats(questionPayload);
                                                            const singleBuckets = Object.entries(
                                                              (questionPayload?.singleQuestions || [])
                                                                .filter((question) =>
                                                                  questionMatchesSearch(question, normalizedSearch),
                                                                )
                                                                .reduce<Record<string, Question[]>>((acc, question) => {
                                                                  const key = question.questionType || "UNKNOWN";
                                                                  acc[key] = [...(acc[key] || []), question];
                                                                  return acc;
                                                                }, {}),
                                                            );

                                                            const filteredGroups = (questionPayload?.questionGroups || []).filter(
                                                              (group) => questionGroupMatchesSearch(group, normalizedSearch),
                                                            );

                                                            return (
                                                              <div
                                                                key={lesson.id}
                                                                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                                                              >
                                                                <button
                                                                  onClick={() => void toggleLesson(lesson.id)}
                                                                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-slate-50"
                                                                >
                                                                  <div className="flex min-w-0 items-center gap-3">
                                                                    {expandedLessons[lesson.id] ? (
                                                                      <ChevronDown className="h-4 w-4 text-slate-400" />
                                                                    ) : (
                                                                      <ChevronRight className="h-4 w-4 text-slate-400" />
                                                                    )}
                                                                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f4f8ff] text-[#155ca5]">
                                                                      <Layers3 className="h-4 w-4" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                                                        Lesson
                                                                      </p>
                                                                      <p className="truncate font-bold text-slate-900">
                                                                        {lesson.name}
                                                                      </p>
                                                                    </div>
                                                                  </div>

                                                                  <div className="text-right text-xs text-slate-500">
                                                                    {lessonLoading
                                                                      ? "Loading questions..."
                                                                      : `${stats.totalQuestions} questions`}
                                                                  </div>
                                                                </button>

                                                                {expandedLessons[lesson.id] && (
                                                                  <div className="border-t border-slate-100 bg-slate-50 p-4">
                                                                    {lessonLoading ? (
                                                                      <div className="flex items-center gap-2 text-sm text-slate-500">
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                        Loading lesson questions...
                                                                      </div>
                                                                    ) : !questionPayload ? (
                                                                      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                                                                        Chưa tải được dữ liệu câu hỏi cho lesson này.
                                                                      </div>
                                                                    ) : stats.totalQuestions === 0 ? (
                                                                      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                                                                        Lesson này chưa có câu hỏi.
                                                                      </div>
                                                                    ) : (
                                                                      <div className="space-y-4">
                                                                        <div className="grid gap-3 md:grid-cols-3">
                                                                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                                                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                                                              Singles
                                                                            </p>
                                                                            <p className="mt-2 text-2xl font-black text-slate-900">
                                                                              {stats.singleCount}
                                                                            </p>
                                                                          </div>
                                                                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                                                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                                                              Groups
                                                                            </p>
                                                                            <p className="mt-2 text-2xl font-black text-slate-900">
                                                                              {stats.groupCount}
                                                                            </p>
                                                                          </div>
                                                                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                                                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                                                              Group Children
                                                                            </p>
                                                                            <p className="mt-2 text-2xl font-black text-slate-900">
                                                                              {stats.childCount}
                                                                            </p>
                                                                          </div>
                                                                        </div>

                                                                        {singleBuckets.length > 0 && (
                                                                          <div className="space-y-3">
                                                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                                                                              <FileText className="h-4 w-4 text-[#155ca5]" />
                                                                              Single Questions By Type
                                                                            </div>

                                                                            {singleBuckets.map(([type, questions]) => {
                                                                              const typeKey = `lesson-${lesson.id}-type-${type}`;
                                                                              return (
                                                                                <div
                                                                                  key={typeKey}
                                                                                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                                                                                >
                                                                                  <button
                                                                                    onClick={() => toggleType(typeKey)}
                                                                                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                                                                                  >
                                                                                    <div className="flex min-w-0 items-center gap-3">
                                                                                      {expandedTypeKeys[typeKey] ? (
                                                                                        <ChevronDown className="h-4 w-4 text-slate-400" />
                                                                                      ) : (
                                                                                        <ChevronRight className="h-4 w-4 text-slate-400" />
                                                                                      )}
                                                                                      <div className="min-w-0">
                                                                                        <p className="font-bold text-slate-900">
                                                                                          {getQuestionTypeLabel(type)}
                                                                                        </p>
                                                                                      </div>
                                                                                    </div>
                                                                                    <span className="text-xs text-slate-500">
                                                                                      {questions.length} questions
                                                                                    </span>
                                                                                  </button>

                                                                                  {expandedTypeKeys[typeKey] && (
                                                                                    <div className="space-y-3 border-t border-slate-100 bg-slate-50 p-4">
                                                                                      {questions.map((question) => (
                                                                                        <div
                                                                                          key={question.id}
                                                                                          className="rounded-xl border border-slate-200 bg-white p-4"
                                                                                        >
                                                                                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                                                                            <span className="rounded-full bg-[#eef5ff] px-2.5 py-1 font-bold text-[#155ca5]">
                                                                                              #{question.id}
                                                                                            </span>
                                                                                            <span>{question.questionType}</span>
                                                                                          </div>
                                                                                          <p className="mt-3 font-semibold text-slate-900">
                                                                                            {getQuestionPreview(question)}
                                                                                          </p>
                                                                                          {question.correctAnswer && (
                                                                                            <p className="mt-2 text-sm text-slate-500">
                                                                                              Correct answer: {question.correctAnswer}
                                                                                            </p>
                                                                                          )}
                                                                                        </div>
                                                                                      ))}
                                                                                    </div>
                                                                                  )}
                                                                                </div>
                                                                              );
                                                                            })}
                                                                          </div>
                                                                        )}

                                                                        {filteredGroups.length > 0 && (
                                                                          <div className="space-y-3">
                                                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                                                                              <FolderTree className="h-4 w-4 text-[#155ca5]" />
                                                                              Question Groups
                                                                            </div>

                                                                            {filteredGroups.map((group) => {
                                                                              const groupKey = `lesson-${lesson.id}-group-${group.id}`;
                                                                              return (
                                                                                <div
                                                                                  key={groupKey}
                                                                                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                                                                                >
                                                                                  <button
                                                                                    onClick={() => toggleGroup(groupKey)}
                                                                                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                                                                                  >
                                                                                    <div className="flex min-w-0 items-center gap-3">
                                                                                      {expandedGroupKeys[groupKey] ? (
                                                                                        <ChevronDown className="h-4 w-4 text-slate-400" />
                                                                                      ) : (
                                                                                        <ChevronRight className="h-4 w-4 text-slate-400" />
                                                                                      )}
                                                                                      <div className="min-w-0">
                                                                                        <p className="font-bold text-slate-900">
                                                                                          {group.title || getQuestionTypeLabel(group.groupType)}
                                                                                        </p>
                                                                                        <p className="text-xs text-slate-500">
                                                                                          {getQuestionTypeLabel(group.groupType)} • {group.questions?.length || 0} child questions
                                                                                        </p>
                                                                                      </div>
                                                                                    </div>
                                                                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                                                                                      Group #{group.id}
                                                                                    </span>
                                                                                  </button>

                                                                                  {expandedGroupKeys[groupKey] && (
                                                                                    <div className="space-y-4 border-t border-slate-100 bg-slate-50 p-4">
                                                                                      {(group.instruction || group.sharedContent) && (
                                                                                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                                                                                          {group.instruction && (
                                                                                            <p className="text-sm text-slate-500">
                                                                                              Instruction: {group.instruction}
                                                                                            </p>
                                                                                          )}
                                                                                          {group.sharedContent && (
                                                                                            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                                                                                              {group.sharedContent}
                                                                                            </p>
                                                                                          )}
                                                                                        </div>
                                                                                      )}

                                                                                      <div className="space-y-3">
                                                                                        {(group.questions || []).map((question) => (
                                                                                          <div
                                                                                            key={question.id}
                                                                                            className="rounded-xl border border-slate-200 bg-white p-4"
                                                                                          >
                                                                                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                                                                              <span className="rounded-full bg-[#eef5ff] px-2.5 py-1 font-bold text-[#155ca5]">
                                                                                                #{question.id}
                                                                                              </span>
                                                                                              <span>
                                                                                                {getQuestionTypeLabel(question.questionType)}
                                                                                              </span>
                                                                                            </div>
                                                                                            <p className="mt-3 font-semibold text-slate-900">
                                                                                              {getQuestionPreview(question)}
                                                                                            </p>
                                                                                            {question.correctAnswer && (
                                                                                              <p className="mt-2 text-sm text-slate-500">
                                                                                                Correct answer: {question.correctAnswer}
                                                                                              </p>
                                                                                            )}
                                                                                          </div>
                                                                                        ))}
                                                                                      </div>
                                                                                    </div>
                                                                                  )}
                                                                                </div>
                                                                              );
                                                                            })}
                                                                          </div>
                                                                        )}
                                                                      </div>
                                                                    )}
                                                                  </div>
                                                                )}
                                                              </div>
                                                            );
                                                          })}
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

        {grades.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <HelpCircle className="mx-auto mb-4 h-16 w-16 text-slate-300" />
            <p className="text-slate-500">Không có grade nào để hiển thị.</p>
          </div>
        )}
      </div>
    </div>
  );
}
