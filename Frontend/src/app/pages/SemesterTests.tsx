import { useEffect, useState } from "react";
import { ClipboardCheck, Loader2, RefreshCcw } from "lucide-react";
import {
  createSemesterTest,
  getSemesterTestById,
  getSemesterTests,
  updateSemesterTest,
} from "@/api";
import {
  getAllGrades,
  getLessonsBySection,
  getQuestionsByLesson,
  getSectionsByUnit,
  getUnitsByGrade,
} from "@/api/admin";
import type { Grade, Question, QuestionGroup, Unit } from "@/api/admin/types";
import type { SemesterTestRequest, SemesterTestResponse } from "@/api/types";
import { NotificationPopup } from "@/utils/NotificationPopup";
import { useNotificationPopup } from "@/utils/useNotificationPopup";

const initialForm: SemesterTestRequest = {
  title: "",
  startUnit: 1,
  endUnit: 3,
  timeLimit: 45,
  gradeId: 1,
  questionGroupIds: [],
  questionIds: [],
  includeWrongQuestions: false,
  aiQuestionCount: 0,
  aiQuestionTopic: "",
};

function toGradeLabel(grade: Grade): string {
  return grade.name;
}

function toUnitLabel(unit: Unit): string {
  const unitNumber = unit.unitNumber ?? unit.id;
  return `Unit ${unitNumber}: ${unit.name}`;
}

function toQuestionLabel(question: Question): string {
  const content = question.content?.trim() || question.instruction?.trim() || "Untitled question";
  return `#${question.id} - ${content}`;
}

function toQuestionGroupLabel(group: QuestionGroup): string {
  const title = group.title?.trim() || group.instruction?.trim() || `Group #${group.id}`;
  const count = group.questions?.length ?? 0;
  return `${title} (${count} question${count === 1 ? "" : "s"})`;
}

function toggleId(list: number[], id: number): number[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

export function SemesterTests() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [form, setForm] = useState<SemesterTestRequest>(initialForm);
  const [items, setItems] = useState<SemesterTestResponse[]>([]);
  const [selected, setSelected] = useState<SemesterTestResponse | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingQuestionBank, setLoadingQuestionBank] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [availableQuestionGroups, setAvailableQuestionGroups] = useState<QuestionGroup[]>([]);
  const popup = useNotificationPopup({
    autoClose: true,
    autoCloseDuration: 2500,
  });

  const loadData = async () => {
    setLoading(true);
    const [gradeResponse, semesterResponse] = await Promise.all([
      getAllGrades(),
      getSemesterTests(),
    ]);

    if (gradeResponse.success && gradeResponse.data) {
      const gradeList = gradeResponse.data;
      setGrades(gradeList);
      setForm((prev) => ({
        ...prev,
        gradeId: gradeList.some((grade) => grade.id === prev.gradeId)
          ? prev.gradeId
          : gradeList[0]?.id || 1,
      }));
    } else {
      popup.error({
        title: "Load failed",
        message: gradeResponse.error?.message || "Could not load grades.",
      });
    }

    if (semesterResponse.success && semesterResponse.data) {
      setItems(semesterResponse.data);
    } else {
      popup.error({
        title: "Load failed",
        message: semesterResponse.error?.message || "Could not load semester tests.",
      });
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    const loadUnits = async () => {
      if (!form.gradeId) {
        setUnits([]);
        return;
      }

      setLoadingUnits(true);
      const response = await getUnitsByGrade({ gradeId: form.gradeId });

      if (response.success && response.data) {
        const nextUnits = response.data;
        setUnits(nextUnits);

        const firstUnitNumber = nextUnits[0]?.unitNumber ?? nextUnits[0]?.id ?? 1;
        const thirdUnitNumber =
          nextUnits[Math.min(2, nextUnits.length - 1)]?.unitNumber ??
          nextUnits[Math.min(2, nextUnits.length - 1)]?.id ??
          firstUnitNumber;

        setForm((prev) => ({
          ...prev,
          startUnit:
            prev.startUnit &&
            nextUnits.some((unit) => (unit.unitNumber ?? unit.id) === prev.startUnit)
              ? prev.startUnit
              : firstUnitNumber,
          endUnit:
            prev.endUnit &&
            nextUnits.some((unit) => (unit.unitNumber ?? unit.id) === prev.endUnit)
              ? prev.endUnit
              : thirdUnitNumber,
        }));
      } else {
        setUnits([]);
        popup.error({
          title: "Load failed",
          message: response.error?.message || "Could not load units.",
        });
      }

      setLoadingUnits(false);
    };

    void loadUnits();
  }, [form.gradeId]);

  useEffect(() => {
    const loadQuestionBankForRange = async () => {
      if (!form.gradeId || form.endUnit < form.startUnit || units.length === 0) {
        setAvailableQuestions([]);
        setAvailableQuestionGroups([]);
        return;
      }

      const selectedUnits = units.filter((unit) => {
        const unitNumber = unit.unitNumber ?? unit.id;
        return unitNumber >= form.startUnit && unitNumber <= form.endUnit;
      });

      if (selectedUnits.length === 0) {
        setAvailableQuestions([]);
        setAvailableQuestionGroups([]);
        return;
      }

      setLoadingQuestionBank(true);

      const sectionResponses = await Promise.all(
        selectedUnits.map((unit) => getSectionsByUnit({ unitId: unit.id })),
      );

      const sections = sectionResponses
        .filter((response) => response.success && response.data)
        .flatMap((response) => response.data ?? []);

      const lessonResponses = await Promise.all(
        sections.map((section) => getLessonsBySection({ sectionId: section.id })),
      );

      const lessons = lessonResponses
        .filter((response) => response.success && response.data)
        .flatMap((response) => response.data ?? []);

      const questionResponses = await Promise.all(
        lessons.map((lesson) => getQuestionsByLesson({ lessonId: lesson.id })),
      );

      const questionMap = new Map<number, Question>();
      const questionGroupMap = new Map<number, QuestionGroup>();

      for (const response of questionResponses) {
        if (!response.success || !response.data) {
          continue;
        }

        for (const question of response.data.singleQuestions ?? []) {
          questionMap.set(question.id, question);
        }

        for (const group of response.data.questionGroups ?? []) {
          questionGroupMap.set(group.id, group);
          for (const question of group.questions ?? []) {
            questionMap.set(question.id, question);
          }
        }
      }

      setAvailableQuestions(Array.from(questionMap.values()));
      setAvailableQuestionGroups(Array.from(questionGroupMap.values()));
      setForm((prev) => ({
        ...prev,
        questionIds: prev.questionIds.filter((id) => questionMap.has(id)),
        questionGroupIds: prev.questionGroupIds.filter((id) => questionGroupMap.has(id)),
      }));
      setLoadingQuestionBank(false);
    };

    void loadQuestionBankForRange();
  }, [form.gradeId, form.startUnit, form.endUnit, units]);

  const handleCreate = async () => {
    const payload = {
      ...form,
      title: form.title.trim(),
      aiQuestionCount: form.aiQuestionCount || undefined,
      aiQuestionTopic: form.aiQuestionTopic?.trim() || undefined,
    };

    if (payload.endUnit < payload.startUnit) {
      popup.warning({
        title: "Invalid unit range",
        message: "End unit must be greater than or equal to start unit.",
      });
      return;
    }

    setSaving(true);
    const response = editingId
      ? await updateSemesterTest(editingId, payload)
      : await createSemesterTest(payload);

    if (response.success && response.data) {
      setSelected(response.data);
      popup.success({
        title: editingId ? "Updated" : "Created",
        message: `Semester test "${response.data.title}" is ready.`,
      });
      setForm((prev) => ({ ...initialForm, gradeId: prev.gradeId }));
      setEditingId(null);
      await loadData();
    } else {
      popup.error({
        title: "Create failed",
        message: response.error?.message || "Could not create semester test.",
      });
    }

    setSaving(false);
  };

  const handleSelect = async (id: number) => {
    const response = await getSemesterTestById(id);
    if (response.success && response.data) {
      setSelected(response.data);
    }
  };

  const handleEdit = async (id: number) => {
    const response = await getSemesterTestById(id);
    if (!response.success || !response.data) {
      popup.error({
        title: "Load failed",
        message: response.error?.message || "Could not load semester test details.",
      });
      return;
    }

    setSelected(response.data);
    setEditingId(response.data.id);
    setForm({
      title: response.data.title,
      startUnit: response.data.startUnit,
      endUnit: response.data.endUnit,
      timeLimit: response.data.timeLimit,
      gradeId: response.data.gradeId,
      questionGroupIds: response.data.questionGroupIds,
      questionIds: response.data.questionIds,
      includeWrongQuestions: false,
      aiQuestionCount: 0,
      aiQuestionTopic: "",
    });
  };

  const resetForm = () => {
    setForm((prev) => ({ ...initialForm, gradeId: prev.gradeId || initialForm.gradeId }));
    setEditingId(null);
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 space-y-8 pb-24 md:pb-12">
      <section className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#155ca5]/10 px-4 py-2 text-sm font-bold text-[#155ca5]">
          <ClipboardCheck className="w-4 h-4" />
          Exam Builder
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-[#155ca5] tracking-tight">
          Semester Tests
        </h1>
        <p className="max-w-2xl text-gray-600">
          Build a semester test from fetched grade and unit selectors, then add
          manual question IDs, question groups, and optional AI-generated items.
        </p>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
        <div className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-bold text-gray-700">Title</span>
            <p className="text-xs text-gray-500">Example: Semester test 1</p>
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Semester test title"
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#155ca5]"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-gray-700">Grade / Class</span>
            <p className="text-xs text-gray-500">
              Select the grade this test belongs to.
            </p>
            <select
              value={form.gradeId}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  gradeId: Number(e.target.value),
                  startUnit: 1,
                  endUnit: 3,
                }))
              }
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#155ca5]"
            >
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {toGradeLabel(grade)}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-3 gap-3">
            <label className="block space-y-2">
              <span className="text-sm font-bold text-gray-700">Start Unit</span>
              <select
                value={form.startUnit}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, startUnit: Number(e.target.value) }))
                }
                disabled={loadingUnits || units.length === 0}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#155ca5] disabled:bg-gray-50"
              >
                {units.map((unit) => (
                  <option key={unit.id} value={unit.unitNumber ?? unit.id}>
                    {toUnitLabel(unit)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-gray-700">End Unit</span>
              <select
                value={form.endUnit}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, endUnit: Number(e.target.value) }))
                }
                disabled={loadingUnits || units.length === 0}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#155ca5] disabled:bg-gray-50"
              >
                {units.map((unit) => (
                  <option key={unit.id} value={unit.unitNumber ?? unit.id}>
                    {toUnitLabel(unit)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-gray-700">Time Limit</span>
              <input
                type="number"
                min={1}
                value={form.timeLimit}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, timeLimit: Number(e.target.value) }))
                }
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#155ca5]"
                placeholder="45"
              />
            </label>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-bold text-gray-700">Question Groups</span>
            <p className="text-xs text-gray-500">
              Select groups from the current unit range. Backend keeps these groups as-is;
              it only auto-adds wrong questions and AI questions when you enable them.
            </p>
            <div className="max-h-56 overflow-y-auto rounded-2xl border border-gray-300 bg-white p-3">
              {loadingQuestionBank ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                  Loading question groups...
                </div>
              ) : availableQuestionGroups.length > 0 ? (
                <div className="space-y-2">
                  {availableQuestionGroups.map((group) => {
                    const checked = form.questionGroupIds.includes(group.id);
                    return (
                      <label
                        key={group.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 transition-colors ${
                          checked
                            ? "border-[#155ca5] bg-[#f8fbff]"
                            : "border-slate-200 hover:border-[#155ca5]/30"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setForm((prev) => ({
                              ...prev,
                              questionGroupIds: toggleId(prev.questionGroupIds, group.id),
                            }))
                          }
                          className="mt-1"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-[#1e2e51]">
                            {toQuestionGroupLabel(group)}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            Group ID: {group.id}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-gray-500">
                  No question groups found in this unit range.
                </div>
              )}
            </div>
            <div className="text-xs font-semibold text-[#155ca5]">
              Selected groups: {form.questionGroupIds.length}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-bold text-gray-700">Single Questions</span>
            <p className="text-xs text-gray-500">
              These are manually chosen question IDs for the test.
            </p>
            <div className="max-h-64 overflow-y-auto rounded-2xl border border-gray-300 bg-white p-3">
              {loadingQuestionBank ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                  Loading questions...
                </div>
              ) : availableQuestions.length > 0 ? (
                <div className="space-y-2">
                  {availableQuestions.map((question) => {
                    const checked = form.questionIds.includes(question.id);
                    return (
                      <label
                        key={question.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 transition-colors ${
                          checked
                            ? "border-[#155ca5] bg-[#f8fbff]"
                            : "border-slate-200 hover:border-[#155ca5]/30"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setForm((prev) => ({
                              ...prev,
                              questionIds: toggleId(prev.questionIds, question.id),
                            }))
                          }
                          className="mt-1"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-[#1e2e51]">
                            {toQuestionLabel(question)}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            Type: {question.questionType}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-gray-500">
                  No questions found in this unit range.
                </div>
              )}
            </div>
            <div className="text-xs font-semibold text-[#155ca5]">
              Selected questions: {form.questionIds.length}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-2">
              <span className="text-sm font-bold text-gray-700">AI Question Count</span>
              <input
                type="number"
                min={0}
                value={form.aiQuestionCount || 0}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    aiQuestionCount: Number(e.target.value),
                  }))
                }
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#155ca5]"
                placeholder="5"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-bold text-gray-700">AI Topic</span>
              <input
                value={form.aiQuestionTopic || ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    aiQuestionTopic: e.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#155ca5]"
                placeholder="Environment"
              />
            </label>
          </div>

          <label className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3">
            <input
              type="checkbox"
              checked={Boolean(form.includeWrongQuestions)}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  includeWrongQuestions: e.target.checked,
                }))
              }
            />
            <span className="text-sm font-semibold text-gray-700">
              Include wrong questions
            </span>
          </label>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className="flex-1 rounded-2xl bg-[#155ca5] py-3 font-bold text-white hover:bg-[#0f4c88] disabled:opacity-60"
            >
              {saving ? "Saving..." : editingId ? "Update Semester Test" : "Create Semester Test"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-2xl border border-gray-300 px-4 py-3 font-bold text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-[#1e2e51]">Saved Semester Tests</h2>
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
            >
              <RefreshCcw className="w-4 h-4" />
              Reload
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl shadow-sm p-10 text-center text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
              Loading...
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="w-full bg-white rounded-3xl shadow-sm p-6 text-left hover:ring-2 hover:ring-[#155ca5]/20"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-black text-[#1e2e51]">{item.title}</div>
                      <div className="text-sm text-gray-500">
                        Units {item.startUnit} - {item.endUnit} - {item.timeLimit} mins
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#155ca5]">#{item.id}</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleSelect(item.id)}
                      className="rounded-full border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleEdit(item.id)}
                      className="rounded-full bg-[#155ca5]/10 px-3 py-2 text-xs font-bold text-[#155ca5]"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selected && (
            <div className="bg-white rounded-3xl shadow-sm p-6 space-y-3">
              <div className="text-xl font-black text-[#155ca5]">{selected.title}</div>
              <div className="text-sm text-gray-600">
                Grade {selected.gradeId} - Time limit {selected.timeLimit} minutes
              </div>
              <div className="text-sm text-gray-600">
                Question groups: {selected.questionGroupIds.join(", ") || "None"}
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {selected.questionIds.map((questionId) => (
                  <span
                    key={questionId}
                    className="rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-bold text-[#155ca5]"
                  >
                    {questionId}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <NotificationPopup {...popup.notification} onClose={popup.close} />
    </main>
  );
}
