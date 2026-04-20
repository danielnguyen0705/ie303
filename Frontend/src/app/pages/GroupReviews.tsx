import { useEffect, useState } from "react";
import { Layers3, Loader2, RefreshCcw } from "lucide-react";
import {
  createGroupReview,
  getGroupReviewById,
  getGroupReviews,
  updateGroupReview,
} from "@/api";
import {
  getAllGrades,
  getLessonsBySection,
  getQuestionsByLesson,
  getSectionsByUnit,
  getUnitsByGrade,
} from "@/api/admin";
import type { Grade, Question, Unit } from "@/api/admin/types";
import type { GroupReviewRequest, GroupReviewResponse } from "@/api/types";
import { NotificationPopup } from "@/utils/NotificationPopup";
import { useNotificationPopup } from "@/utils/useNotificationPopup";

const initialForm: GroupReviewRequest = {
  title: "",
  startUnit: 1,
  endUnit: 3,
  gradeId: 1,
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

function toggleId(list: number[], id: number): number[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

export function GroupReviews() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [form, setForm] = useState<GroupReviewRequest>(initialForm);
  const [items, setItems] = useState<GroupReviewResponse[]>([]);
  const [selected, setSelected] = useState<GroupReviewResponse | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const popup = useNotificationPopup({
    autoClose: true,
    autoCloseDuration: 2500,
  });

  const loadData = async () => {
    setLoading(true);
    const [gradeResponse, reviewResponse] = await Promise.all([
      getAllGrades(),
      getGroupReviews(),
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

    if (reviewResponse.success && reviewResponse.data) {
      setItems(reviewResponse.data);
    } else {
      popup.error({
        title: "Load failed",
        message: reviewResponse.error?.message || "Could not load group reviews.",
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
    const loadQuestionsForRange = async () => {
      if (!form.gradeId || form.endUnit < form.startUnit || units.length === 0) {
        setAvailableQuestions([]);
        return;
      }

      const selectedUnits = units.filter((unit) => {
        const unitNumber = unit.unitNumber ?? unit.id;
        return unitNumber >= form.startUnit && unitNumber <= form.endUnit;
      });

      if (selectedUnits.length === 0) {
        setAvailableQuestions([]);
        return;
      }

      setLoadingQuestions(true);

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
      for (const response of questionResponses) {
        if (!response.success || !response.data) {
          continue;
        }

        for (const question of response.data.singleQuestions ?? []) {
          questionMap.set(question.id, question);
        }

        for (const group of response.data.questionGroups ?? []) {
          for (const question of group.questions ?? []) {
            questionMap.set(question.id, question);
          }
        }
      }

      const nextQuestions = Array.from(questionMap.values());
      setAvailableQuestions(nextQuestions);
      setForm((prev) => ({
        ...prev,
        questionIds: prev.questionIds.filter((id) => questionMap.has(id)),
      }));
      setLoadingQuestions(false);
    };

    void loadQuestionsForRange();
  }, [form.gradeId, form.startUnit, form.endUnit, units]);

  const handleCreate = async () => {
    const payload = {
      ...form,
      title: form.title.trim(),
      aiQuestionTopic: form.aiQuestionTopic?.trim() || undefined,
      aiQuestionCount: form.aiQuestionCount || undefined,
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
      ? await updateGroupReview(editingId, payload)
      : await createGroupReview(payload);

    if (response.success && response.data) {
      popup.success({
        title: editingId ? "Updated" : "Created",
        message: `Group review "${response.data.title}" is ready.`,
      });
      setSelected(response.data);
      setForm((prev) => ({ ...initialForm, gradeId: prev.gradeId }));
      setEditingId(null);
      await loadData();
    } else {
      popup.error({
        title: "Create failed",
        message: response.error?.message || "Could not create group review.",
      });
    }

    setSaving(false);
  };

  const handleSelect = async (id: number) => {
    const response = await getGroupReviewById(id);
    if (response.success && response.data) {
      setSelected(response.data);
    }
  };

  const handleEdit = async (id: number) => {
    const response = await getGroupReviewById(id);
    if (!response.success || !response.data) {
      popup.error({
        title: "Load failed",
        message: response.error?.message || "Could not load review details.",
      });
      return;
    }

    setSelected(response.data);
    setEditingId(response.data.id);
    setForm({
      title: response.data.title,
      startUnit: response.data.startUnit,
      endUnit: response.data.endUnit,
      gradeId: response.data.gradeId,
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
          <Layers3 className="w-4 h-4" />
          Multi-Unit Review
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-[#155ca5] tracking-tight">
          Group Reviews
        </h1>
        <p className="max-w-2xl text-gray-600">
          Build a review pack from fetched grade and unit selectors. A 3-unit
          block is the recommended pattern, and VIP logic still applies for
          wrong-question import and AI additions.
        </p>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
        <div className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
          <div className="rounded-2xl bg-[#f8fbff] border border-[#dbeafe] px-4 py-3 text-sm text-[#1e2e51]">
            Suggested format: use 3-unit blocks like 1-3, 4-6, 7-9.
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-gray-700">Title</span>
            <p className="text-xs text-gray-500">Example: Group review U1-U3</p>
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#155ca5]"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-gray-700">Grade / Class</span>
            <p className="text-xs text-gray-500">
              Choose the grade first so unit selectors can load correctly.
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

          <div className="grid grid-cols-2 gap-3">
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
          </div>

          <div className="space-y-2">
            <span className="text-sm font-bold text-gray-700">Questions In Selected Range</span>
            <p className="text-xs text-gray-500">
              Backend does not auto-pick all normal questions here. Admin chooses them,
              then backend can add wrong questions and AI questions on top.
            </p>
            <div className="max-h-64 overflow-y-auto rounded-2xl border border-gray-300 bg-white p-3">
              {loadingQuestions ? (
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
              Selected: {form.questionIds.length} question(s)
            </div>
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
          <p className="text-xs text-gray-500 -mt-2">
            This adds the user's wrong questions from the selected grade and unit span.
          </p>

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
                placeholder="3"
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
                placeholder="School life"
              />
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className="flex-1 rounded-2xl bg-[#155ca5] py-3 font-bold text-white hover:bg-[#0f4c88] disabled:opacity-60"
            >
              {saving ? "Saving..." : editingId ? "Update Group Review" : "Create Group Review"}
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
            <h2 className="text-2xl font-black text-[#1e2e51]">Saved Group Reviews</h2>
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
            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl shadow-sm p-6 text-left hover:ring-2 hover:ring-[#155ca5]/20"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-black text-[#1e2e51]">{item.title}</div>
                    <span className="text-xs font-bold text-[#155ca5]">#{item.id}</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Units {item.startUnit} - {item.endUnit} - Grade {item.gradeId}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.questionIds.map((questionId) => (
                      <span
                        key={questionId}
                        className="rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-bold text-[#155ca5]"
                      >
                        {questionId}
                      </span>
                    ))}
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
                Unit span: {selected.startUnit} to {selected.endUnit}
              </div>
              <div className="text-sm text-gray-600">
                Total question IDs: {selected.questionIds.length}
              </div>
            </div>
          )}
        </div>
      </section>

      <NotificationPopup {...popup.notification} onClose={popup.close} />
    </main>
  );
}
