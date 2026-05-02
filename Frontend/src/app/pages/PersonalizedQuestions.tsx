import { useEffect, useMemo, useState } from "react";
import { Brain, CheckCircle2, Loader2, RefreshCcw, Sparkles, XCircle } from "lucide-react";
import { getPersonalizedQuestions, getUnitsByGradeProgress, submitQuestionHistory } from "@/api";
import { getAllGrades } from "@/api/admin";
import type { PersonalizedQuestionsRequest } from "@/api/types";
import type { Grade } from "@/api/admin/types";
import type { QuestionDto } from "@/api/questions";
import type { UnitProgressItem } from "@/api/units";
import { NotificationPopup } from "@/utils/NotificationPopup";
import { useNotificationPopup } from "@/utils/useNotificationPopup";

const initialForm: PersonalizedQuestionsRequest = {
  questionCount: 5,
  gradeId: 0,
  startUnit: 1,
  endUnit: 1,
  topic: "",
};

export function PersonalizedQuestions() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [units, setUnits] = useState<UnitProgressItem[]>([]);
  const [form, setForm] = useState<PersonalizedQuestionsRequest>(initialForm);
  const [questions, setQuestions] = useState<QuestionDto[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [generating, setGenerating] = useState(false);
  const popup = useNotificationPopup({
    autoClose: true,
    autoCloseDuration: 2500,
  });

  useEffect(() => {
    const loadGrades = async () => {
      setLoadingGrades(true);
      const response = await getAllGrades();

      const gradeList = response.data;
      if (response.success && gradeList) {
        setGrades(gradeList);
        if (gradeList[0]?.id) {
          setForm((prev) => ({ ...prev, gradeId: gradeList[0].id }));
        }
      } else {
        popup.error({
          title: "Load failed",
          message: response.error?.message || "Could not load grades.",
        });
      }

      setLoadingGrades(false);
    };

    void loadGrades();
  }, []);

  useEffect(() => {
    const loadUnits = async () => {
      if (!form.gradeId) {
        setUnits([]);
        return;
      }

      setLoadingUnits(true);
      const response = await getUnitsByGradeProgress(form.gradeId);

      if (response.success && response.data) {
        const nextUnits = [...response.data].sort((a, b) => a.unitNumber - b.unitNumber);
        setUnits(nextUnits);

        if (nextUnits.length > 0) {
          const minUnit = nextUnits[0].unitNumber;
          const maxUnit = nextUnits[nextUnits.length - 1].unitNumber;

          setForm((prev) => {
            const safeStart =
              nextUnits.some((unit) => unit.unitNumber === prev.startUnit) ? prev.startUnit : minUnit;
            const safeEnd =
              nextUnits.some((unit) => unit.unitNumber === prev.endUnit) ? prev.endUnit : maxUnit;

            return {
              ...prev,
              startUnit: safeStart,
              endUnit: safeEnd < safeStart ? safeStart : safeEnd,
            };
          });
        }
      } else {
        setUnits([]);
        popup.error({
          title: "Load failed",
          message: response.error?.message || "Could not load units for this grade.",
        });
      }

      setLoadingUnits(false);
    };

    void loadUnits();
  }, [form.gradeId]);

  const correctCount = useMemo(
    () =>
      questions.filter((question) => {
        const answer = answers[question.id];
        const selected = question.options?.find((option) => option.optionKey === answer);
        return Boolean(selected?.isCorrect);
      }).length,
    [answers, questions],
  );

  const answeredCount = useMemo(
    () => questions.filter((question) => Boolean(answers[question.id])).length,
    [answers, questions],
  );

  const handleGenerate = async () => {
    if (!form.topic.trim()) {
      popup.warning({
        title: "Missing topic",
        message: "Please enter a topic before generating questions.",
      });
      return;
    }

    if (!form.gradeId) {
      popup.warning({
        title: "Missing grade",
        message: "Please choose a grade before generating questions.",
      });
      return;
    }

    if (form.startUnit > form.endUnit) {
      popup.warning({
        title: "Invalid unit range",
        message: "Start unit must be less than or equal to end unit.",
      });
      return;
    }

    setGenerating(true);
    const response = await getPersonalizedQuestions({
      ...form,
      topic: form.topic.trim(),
    });

    if (response.success && response.data) {
      setQuestions(response.data);
      setAnswers({});
      setSubmitted(false);
      popup.success({
        title: "Generated",
        message: `Created ${response.data.length} personalized questions.`,
      });
    } else {
      popup.error({
        title: "Generation failed",
        message:
          response.error?.message ||
          "Could not generate questions. You may need some wrong-answer history in this grade/unit range first.",
      });
    }

    setGenerating(false);
  };

  const handleSubmitTest = async () => {
    const answeredQuestions = questions.filter((question) => Boolean(answers[question.id]));
    if (answeredQuestions.length === 0) {
      popup.warning({
        title: "Chưa có đáp án",
        message: "Hãy chọn ít nhất một đáp án trước khi nộp bài.",
      });
      return;
    }

    setSubmitting(true);
    await Promise.all(
      answeredQuestions.map(async (question) => {
        const selectedKey = answers[question.id];
        const selectedOption = question.options?.find((option) => option.optionKey === selectedKey);
        if (!selectedOption) return;

        await submitQuestionHistory({
          questionId: question.id,
          answer_text: selectedOption.content,
        });
      }),
    );
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 space-y-8 pb-24 md:pb-12">
      <section className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#155ca5]/10 px-4 py-2 text-sm font-bold text-[#155ca5]">
          <Sparkles className="w-4 h-4" />
          VIP AI Practice
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-[#155ca5] tracking-tight">
          Personalized Questions
        </h1>
        <p className="text-gray-600 font-medium">
          Generate a fresh practice set by grade, unit range, and topic.
        </p>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">
        <div className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 text-[#155ca5] font-black text-lg">
            <Brain className="w-5 h-5" />
            Generate Set
          </div>

          {loadingGrades ? (
            <div className="py-8 flex items-center justify-center text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading grades...
            </div>
          ) : (
            <>
              <label className="block space-y-2">
                <span className="text-sm font-bold text-gray-700">Grade</span>
                <select
                  value={form.gradeId}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      gradeId: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#155ca5]"
                >
                  {grades.length === 0 && <option value={0}>No grades available</option>}
                  {grades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-gray-700">Start Unit</span>
                  <select
                    disabled={loadingUnits || units.length === 0}
                    value={form.startUnit}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        startUnit: Number(e.target.value),
                        endUnit:
                          prev.endUnit < Number(e.target.value)
                            ? Number(e.target.value)
                            : prev.endUnit,
                      }))
                    }
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#155ca5]"
                  >
                    {loadingUnits ? (
                      <option value={form.startUnit}>Loading units...</option>
                    ) : units.length === 0 ? (
                      <option value={form.startUnit}>No units found</option>
                    ) : (
                      units.map((unit) => (
                        <option key={unit.unitId} value={unit.unitNumber}>
                          Unit {unit.unitNumber} - {unit.unitTitle}
                        </option>
                      ))
                    )}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-bold text-gray-700">End Unit</span>
                  <select
                    disabled={loadingUnits || units.length === 0}
                    value={form.endUnit}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        endUnit: Number(e.target.value),
                      }))
                    }
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#155ca5]"
                  >
                    {loadingUnits ? (
                      <option value={form.endUnit}>Loading units...</option>
                    ) : units.length === 0 ? (
                      <option value={form.endUnit}>No units found</option>
                    ) : (
                      units
                        .filter((unit) => unit.unitNumber >= form.startUnit)
                        .map((unit) => (
                          <option key={unit.unitId} value={unit.unitNumber}>
                            Unit {unit.unitNumber} - {unit.unitTitle}
                          </option>
                        ))
                    )}
                  </select>
                </label>
              </div>

              <div className="rounded-2xl border border-[#dbeafe] bg-[#f8fbff] p-4 text-sm text-[#1e2e51]">
                AI practice here is generated from your wrong-question history.
                If you have not answered questions incorrectly yet in the selected
                grade and unit range, the backend can return no personalized set.
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-bold text-gray-700">Question Count</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={form.questionCount}
                  onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                      questionCount: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#155ca5]"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-bold text-gray-700">Topic</span>
                <textarea
                  rows={5}
                  value={form.topic}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      topic: e.target.value,
                    }))
                  }
                  placeholder="Healthy lifestyle, school life, environment..."
                  className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none resize-none focus:border-[#155ca5]"
                />
              </label>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="w-full rounded-2xl bg-[#155ca5] text-white py-3 font-bold hover:bg-[#0f4c88] disabled:opacity-60"
              >
                {generating ? "Generating..." : "Generate Questions"}
              </button>
            </>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-2xl font-black text-[#1e2e51]">
                Generated Result
              </h2>
              <p className="text-sm text-gray-500">
                {questions.length > 0
                  ? `${questions.length} question(s) ready`
                  : "No personalized questions yet"}
              </p>
            </div>

            {questions.length > 0 && (
              <button
                type="button"
                onClick={() => setQuestions([])}
                className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                <RefreshCcw className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>

          {questions.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-sm p-10 text-center text-gray-500">
              Generate a set to start a personalized mini-test from your wrong-answer history.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="text-xl font-black text-[#1e2e51]">
                      Personalized Mini Test
                    </h3>
                    <p className="text-sm text-gray-500">
                      Answer each generated question, then submit the whole test.
                    </p>
                  </div>
                  <div className="rounded-full bg-[#f8fbff] px-4 py-2 text-sm font-bold text-[#155ca5]">
                    Answered {answeredCount}/{questions.length}
                  </div>
                </div>

                {submitted && (
                  <div className="rounded-2xl border border-[#dbeafe] bg-[#f8fbff] p-4 text-[#1e2e51]">
                    <div className="font-black">Kết quả</div>
                    <div className="mt-2 text-sm">
                      Bạn làm đúng {correctCount}/{questions.length} câu.
                    </div>
                  </div>
                )}
              </div>

              {questions.map((question, index) => (
                <article
                  key={question.id}
                  className="bg-white rounded-3xl shadow-sm p-6 space-y-4"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="inline-flex rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#155ca5]">
                      Question {index + 1}
                    </span>
                    <span className="text-xs font-bold text-gray-500">
                      {question.questionType}
                    </span>
                  </div>

                  <h3 className="question-text-unified text-[#1e2e51]">
                    {question.content}
                  </h3>

                  {question.options?.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {question.options.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          disabled={submitted}
                          onClick={() =>
                            setAnswers((prev) => ({
                              ...prev,
                              [question.id]: option.optionKey,
                            }))
                          }
                          className={`rounded-2xl border p-4 text-left transition ${
                            answers[question.id] === option.optionKey
                              ? "border-[#155ca5] bg-[#eef6ff]"
                              : "border-gray-200 bg-gray-50 hover:border-[#155ca5]/40"
                          }`}
                        >
                          <div className="text-sm font-bold text-gray-500">
                            {option.optionKey}
                          </div>
                          <div className="font-semibold text-[#1e2e51]">
                            {option.content}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {submitted && (
                    <div className="space-y-3">
                      {question.options?.some(
                        (option) =>
                          option.optionKey === answers[question.id] && option.isCorrect,
                      ) ? (
                        <div className="rounded-2xl border border-green-300 bg-green-50 p-4 text-green-800">
                          <div className="flex items-center gap-2 font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            Chính xác
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-red-800">
                          <div className="flex items-center gap-2 font-bold">
                            <XCircle className="w-4 h-4" />
                            Chưa đúng
                          </div>
                          <div className="mt-2 text-sm">
                            Đáp án đúng:{" "}
                            {question.options?.find((option) => option.isCorrect)?.optionKey}
                            . {question.options?.find((option) => option.isCorrect)?.content}
                          </div>
                        </div>
                      )}

                      {question.explanation && (
                        <p className="rounded-2xl bg-[#f8fbff] border border-[#dbeafe] p-4 text-sm text-gray-700">
                          {question.explanation}
                        </p>
                      )}
                    </div>
                  )}
                </article>
              ))}

              <div className="flex items-center justify-end gap-3">
                {submitted ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAnswers({});
                      setSubmitted(false);
                    }}
                    className="rounded-2xl border border-gray-300 px-5 py-3 font-bold text-gray-700 hover:bg-gray-50"
                  >
                    Làm lại bài test
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleSubmitTest()}
                    disabled={submitting}
                    className="rounded-2xl bg-[#155ca5] px-5 py-3 font-bold text-white hover:bg-[#0f4c88] disabled:opacity-60"
                  >
                    {submitting ? "Đang nộp..." : "Nộp bài test"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <NotificationPopup {...popup.notification} onClose={popup.close} />
    </main>
  );
}
