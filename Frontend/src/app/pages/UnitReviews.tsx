import { useEffect, useState } from "react";
import { FileText, Loader2, PlusCircle, RefreshCcw } from "lucide-react";
import {
  createUnitReview,
  getUnitReviewById,
  getUnitReviews,
  updateUnitReview,
} from "@/api";
import {
  getAllGrades,
  getLessonsBySection,
  getQuestionsByLesson,
  getSectionsByUnit,
  getUnitsByGrade,
} from "@/api/admin";
import type { Grade, Question, Unit } from "@/api/admin/types";
import type { UnitReviewRequest, UnitReviewResponse } from "@/api/types";
import { NotificationPopup } from "@/utils/NotificationPopup";
import { useNotificationPopup } from "@/utils/useNotificationPopup";

const initialForm: UnitReviewRequest = {
  title: "",
  unitId: 0,
  questionIds: [],
  includeWrongQuestions: false,
};

function toUnitLabel(unit: Unit): string {
  const unitNumber = unit.unitNumber ?? unit.id;
  return `Unit ${unitNumber}: ${unit.name}`;
}

function toGradeLabel(grade: Grade): string {
  return grade.name;
}

function toQuestionLabel(question: Question): string {
  const content =
    question.content?.trim() || question.instruction?.trim() || "Untitled question";
  return `#${question.id} - ${content}`;
}

function toggleId(list: number[], id: number): number[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

export function UnitReviews() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedGradeId, setSelectedGradeId] = useState<number | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [form, setForm] = useState<UnitReviewRequest>(initialForm);
  const [reviews, setReviews] = useState<UnitReviewResponse[]>([]);
  const [selected, setSelected] = useState<UnitReviewResponse | null>(null);
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

  const loadReviews = async () => {
    setLoading(true);

    const [gradesResponse, reviewsResponse] = await Promise.all([
      getAllGrades(),
      getUnitReviews(),
    ]);

    if (gradesResponse.success && gradesResponse.data) {
      const gradeList = gradesResponse.data;
      setGrades(gradeList);
      setSelectedGradeId((prev) =>
        prev && gradeList.some((grade) => grade.id === prev)
          ? prev
          : gradeList[0]?.id ?? null,
      );
    } else {
      popup.error({
        title: "Load failed",
        message: gradesResponse.error?.message || "Could not load grades.",
      });
    }

    if (reviewsResponse.success && reviewsResponse.data) {
      setReviews(reviewsResponse.data);
    } else {
      popup.error({
        title: "Load failed",
        message: reviewsResponse.error?.message || "Could not load unit reviews.",
      });
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadReviews();
  }, []);

  useEffect(() => {
    const loadUnits = async () => {
      if (!selectedGradeId) {
        setUnits([]);
        return;
      }

      setLoadingUnits(true);
      const response = await getUnitsByGrade({ gradeId: selectedGradeId });

      if (response.success && response.data) {
        const unitList = response.data;
        setUnits(unitList);
        setForm((prev) => ({
          ...prev,
          unitId:
            prev.unitId && unitList.some((unit) => unit.id === prev.unitId)
              ? prev.unitId
              : unitList[0]?.id ?? 0,
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
  }, [selectedGradeId]);

  useEffect(() => {
    const loadQuestionsForUnit = async () => {
      if (!form.unitId) {
        setAvailableQuestions([]);
        return;
      }

      setLoadingQuestions(true);

      const sectionResponse = await getSectionsByUnit({ unitId: form.unitId });
      if (!sectionResponse.success || !sectionResponse.data) {
        setAvailableQuestions([]);
        setLoadingQuestions(false);
        return;
      }

      const lessonResponses = await Promise.all(
        sectionResponse.data.map((section) => getLessonsBySection({ sectionId: section.id })),
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

      setAvailableQuestions(Array.from(questionMap.values()));
      setForm((prev) => ({
        ...prev,
        questionIds: prev.questionIds.filter((id) => questionMap.has(id)),
      }));
      setLoadingQuestions(false);
    };

    void loadQuestionsForUnit();
  }, [form.unitId]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    const payload = {
      ...form,
      title: form.title.trim(),
    };

    if (!payload.unitId) {
      popup.warning({
        title: "Missing unit",
        message: "Please choose a unit from the selected grade.",
      });
      return;
    }

    setSaving(true);
    const response = editingId
      ? await updateUnitReview(editingId, payload)
      : await createUnitReview(payload);

    if (response.success && response.data) {
      popup.success({
        title: editingId ? "Updated" : "Created",
        message: `Unit review "${response.data.title}" saved successfully.`,
      });
      resetForm();
      await loadReviews();
      setSelected(response.data);
    } else {
      popup.error({
        title: "Save failed",
        message: response.error?.message || "Could not save unit review.",
      });
    }

    setSaving(false);
  };

  const handleSelect = async (id: number) => {
    const response = await getUnitReviewById(id);
    if (response.success && response.data) {
      setSelected(response.data);
    }
  };

  const handleEdit = (review: UnitReviewResponse) => {
    setEditingId(review.id);
    setForm({
      title: review.title,
      unitId: review.unitId,
      questionIds: review.questionIds,
      includeWrongQuestions: false,
    });
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 space-y-8 pb-24 md:pb-12">
      <section className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#155ca5]/10 px-4 py-2 text-sm font-bold text-[#155ca5]">
          <FileText className="w-4 h-4" />
          Review Builder
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-[#155ca5] tracking-tight">
          Unit Reviews
        </h1>
        <p className="max-w-2xl text-gray-600">
          Create a unit review from fetched grade and unit selectors. Wrong
          question import stays VIP-gated in backend logic.
        </p>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[380px_1fr_340px] gap-6">
        <div className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 text-[#155ca5] font-black text-lg">
            <PlusCircle className="w-5 h-5" />
            {editingId ? "Edit Review" : "Create Review"}
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-gray-700">Grade / Class</span>
            <p className="text-xs text-gray-500">
              Choose a grade first so the unit selector can load the right units.
            </p>
            <select
              value={selectedGradeId ?? ""}
              onChange={(e) => {
                const nextGradeId = Number(e.target.value);
                setSelectedGradeId(nextGradeId);
                setForm((prev) => ({ ...prev, unitId: 0 }));
              }}
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#155ca5]"
            >
              <option value="" disabled>
                Select grade
              </option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {toGradeLabel(grade)}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-gray-700">Unit</span>
            <p className="text-xs text-gray-500">
              Pick a unit from the selected grade.
            </p>
            <select
              value={form.unitId || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, unitId: Number(e.target.value) }))
              }
              disabled={loadingUnits || units.length === 0}
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#155ca5] disabled:bg-gray-50"
            >
              <option value="" disabled>
                {loadingUnits ? "Loading units..." : "Select unit"}
              </option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {toUnitLabel(unit)}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-gray-700">Title</span>
            <p className="text-xs text-gray-500">Example: Unit 3 review</p>
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#155ca5]"
            />
          </label>

          <div className="space-y-2">
            <span className="text-sm font-bold text-gray-700">Questions In Selected Unit</span>
            <p className="text-xs text-gray-500">
              Admin chooses the normal questions here. If you enable wrong-question
              import, backend will add them on top for VIP.
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
                  No questions found in this unit.
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
            This option adds missed questions from the selected unit and is VIP-gated.
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !form.unitId}
              className="flex-1 rounded-2xl bg-[#155ca5] text-white py-3 font-bold hover:bg-[#0f4c88] disabled:opacity-60"
            >
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
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

        <div className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-[#1e2e51]">Saved Reviews</h2>
            <button
              type="button"
              onClick={loadReviews}
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
              {reviews.map((review) => (
                <button
                  key={review.id}
                  type="button"
                  onClick={() => void handleSelect(review.id)}
                  className="bg-white rounded-3xl shadow-sm p-6 text-left hover:ring-2 hover:ring-[#155ca5]/20"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-black text-[#1e2e51]">{review.title}</div>
                    <span className="text-xs font-bold text-[#155ca5]">#{review.id}</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Unit ID {review.unitId}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {review.questionIds.map((questionId) => (
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
                      onClick={(event) => {
                        event.stopPropagation();
                        handleEdit(review);
                      }}
                      className="rounded-full bg-[#155ca5]/10 px-3 py-2 text-xs font-bold text-[#155ca5]"
                    >
                      Edit
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selected && (
            <div className="bg-white rounded-3xl shadow-sm p-6 space-y-3 border border-slate-100">
              <div className="text-xl font-black text-[#155ca5]">{selected.title}</div>
              <div className="text-sm text-gray-600">
                Unit ID: {selected.unitId}
              </div>
              <div className="text-sm text-gray-600">
                Total question IDs: {selected.questionIds.length}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
          <h2 className="text-2xl font-black text-[#1e2e51]">Unit Review Notes</h2>
          <div className="rounded-2xl bg-[#f8fbff] border border-[#dbeafe] px-4 py-3 text-sm text-[#1e2e51]">
            Backend expects <span className="font-black">unitId</span> here, so
            the selector maps directly to the fetched unit IDs instead of typing
            them by hand.
          </div>
          <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
            If you turn on <span className="font-bold">Include wrong questions</span>,
            the service checks VIP before merging missed items.
          </div>
        </div>
      </section>

      <NotificationPopup {...popup.notification} onClose={popup.close} />
    </main>
  );
}
