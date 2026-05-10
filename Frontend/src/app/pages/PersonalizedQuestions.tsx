import { Link } from "react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Brain,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Loader2,
  Minus,
  RefreshCcw,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";
import {
  getMyLearningAnalysis,
  getMyLearningAnalysisHistory,
  getPersonalizedQuestions,
  getUnitsByGradeProgress,
  submitQuestionHistory,
} from "@/api";
import { getAllGrades } from "@/api/admin";
import type { Grade } from "@/api/admin/types";
import type { QuestionDto } from "@/api/questions";
import type { AILearningAnalysis, PersonalizedQuestionsRequest } from "@/api/types";
import type { UnitProgressItem } from "@/api/units";
import { NotificationPopup } from "@/utils/NotificationPopup";
import { useNotificationPopup } from "@/utils/useNotificationPopup";

const initialForm: PersonalizedQuestionsRequest = {
  questionCount: 20,
  gradeId: 0,
  unitNumber: 0,
};

type GradeProgressBundle = {
  gradeId: number;
  gradeName: string;
  units: UnitProgressItem[];
};

function formatAnalysisDate(value?: string | null) {
  if (!value) return "No snapshot yet";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getTrendMeta(trendLabel?: string | null) {
  switch (trendLabel) {
    case "IMPROVING":
      return {
        icon: TrendingUp,
        tone: "text-green-700 bg-green-50 border-green-200",
        label: "Improving",
      };
    case "DECLINING":
      return {
        icon: TrendingDown,
        tone: "text-red-700 bg-red-50 border-red-200",
        label: "Declining",
      };
    default:
      return {
        icon: Minus,
        tone: "text-slate-700 bg-slate-50 border-slate-200",
        label: trendLabel || "Stable",
      };
  }
}

function getGenerationErrorMessage(message?: string) {
  if (!message) {
    return "Could not generate questions. You may need some wrong-answer history first.";
  }

  if (message.includes("502")) {
    return "AI generation is temporarily unavailable (502). Check backend/AI service, or try again after creating some wrong-answer history in this unit.";
  }

  return message;
}

export function PersonalizedQuestions() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [units, setUnits] = useState<UnitProgressItem[]>([]);
  const [progressByGrade, setProgressByGrade] = useState<GradeProgressBundle[]>([]);
  const [form, setForm] = useState<PersonalizedQuestionsRequest>(initialForm);
  const [questions, setQuestions] = useState<QuestionDto[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingEligibility, setLoadingEligibility] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<AILearningAnalysis | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AILearningAnalysis[]>([]);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const popup = useNotificationPopup({
    autoClose: true,
    autoCloseDuration: 2500,
  });

  useEffect(() => {
    const loadGrades = async () => {
      setLoadingGrades(true);
      const response = await getAllGrades();

      if (response.success && response.data) {
        const gradeList = response.data;
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
          const firstUnitNumber = nextUnits[0].unitNumber;
          setForm((prev) => ({
            ...prev,
            unitNumber: nextUnits.some((unit) => unit.unitNumber === prev.unitNumber)
              ? prev.unitNumber
              : firstUnitNumber,
          }));
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

  useEffect(() => {
    const loadEligibility = async () => {
      if (grades.length === 0) {
        setProgressByGrade([]);
        return;
      }

      setLoadingEligibility(true);

      const settled = await Promise.all(
        grades.map(async (grade) => {
          const response = await getUnitsByGradeProgress(grade.id);
          if (!response.success || !response.data) {
            return null;
          }

          return {
            gradeId: grade.id,
            gradeName: grade.name,
            units: [...response.data].sort((a, b) => a.unitNumber - b.unitNumber),
          } satisfies GradeProgressBundle;
        }),
      );

      setProgressByGrade(settled.filter((item): item is GradeProgressBundle => Boolean(item)));
      setLoadingEligibility(false);
    };

    void loadEligibility();
  }, [grades]);

  const completedUnits = useMemo(
    () =>
      progressByGrade.flatMap((grade) =>
        grade.units
          .filter((unit) => Number(unit.progressPercent || 0) >= 100)
          .map((unit) => ({
            gradeId: grade.gradeId,
            gradeName: grade.gradeName,
            unit,
          })),
      ),
    [progressByGrade],
  );

  const hasUnlockedMlInsights = completedUnits.length > 0;

  const quickQaTarget = useMemo(() => {
    const bundles = [...progressByGrade].sort(
      (left, right) =>
        left.units.length - right.units.length || left.gradeName.localeCompare(right.gradeName),
    );
    const selectedBundle = bundles[0];
    if (!selectedBundle || selectedBundle.units.length === 0) return null;

    const completedUnit =
      selectedBundle.units.find((unit) => Number(unit.progressPercent || 0) >= 100) ||
      selectedBundle.units[0];

    return {
      gradeId: selectedBundle.gradeId,
      gradeName: selectedBundle.gradeName,
      unit: completedUnit,
      alreadyCompleted: Number(completedUnit.progressPercent || 0) >= 100,
      totalUnits: selectedBundle.units.length,
    };
  }, [progressByGrade]);

  const selectedUnitProgress = useMemo(
    () => units.find((unit) => unit.unitNumber === form.unitNumber) || null,
    [form.unitNumber, units],
  );

  useEffect(() => {
    const loadAnalysis = async () => {
      if (!hasUnlockedMlInsights) {
        setAnalysis(null);
        setAnalysisHistory([]);
        return;
      }

      setLoadingAnalysis(true);
      const [latestResponse, historyResponse] = await Promise.all([
        getMyLearningAnalysis(),
        getMyLearningAnalysisHistory(),
      ]);

      if (latestResponse.success) {
        setAnalysis(latestResponse.data ?? null);
      } else {
        popup.error({
          title: "ML insights failed",
          message: latestResponse.error?.message || "Could not load your latest ML analysis.",
        });
      }

      if (historyResponse.success) {
        setAnalysisHistory(historyResponse.data ?? []);
      } else {
        popup.error({
          title: "ML history failed",
          message: historyResponse.error?.message || "Could not load ML analysis history.",
        });
      }

      setLoadingAnalysis(false);
    };

    void loadAnalysis();
  }, [hasUnlockedMlInsights]);

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
    if (!form.gradeId) {
      popup.warning({
        title: "Missing grade",
        message: "Please choose a grade before generating questions.",
      });
      return;
    }

    if (!form.unitNumber) {
      popup.warning({
        title: "Missing unit",
        message: "Please choose a unit before generating questions.",
      });
      return;
    }

    setGenerating(true);
    const response = await getPersonalizedQuestions(form);

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
        message: getGenerationErrorMessage(response.error?.message),
      });
    }

    setGenerating(false);
  };

  const handleSubmitTest = async () => {
    const answeredQuestions = questions.filter((question) => Boolean(answers[question.id]));
    if (answeredQuestions.length === 0) {
      popup.warning({
        title: "No answers yet",
        message: "Choose at least one answer before submitting the mini test.",
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

  const latestTrendMeta = getTrendMeta(analysis?.trendLabel);
  const LatestTrendIcon = latestTrendMeta.icon;

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 space-y-8 pb-24 md:pb-12">
      <section className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#155ca5]/10 px-4 py-2 text-sm font-bold text-[#155ca5]">
          <Sparkles className="w-4 h-4" />
          AI Practice And ML Review
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-[#155ca5] tracking-tight">
          Personalized Questions
        </h1>
        <p className="text-gray-600 font-medium max-w-3xl">
          Dùng AI để sinh bộ câu hỏi theo lịch sử sai của bạn, đồng thời xem ML snapshot
          mới nhất khi bạn đã hoàn thành ít nhất 1 unit.
        </p>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">
        <div className="space-y-6">
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

                <label className="block space-y-2">
                  <span className="text-sm font-bold text-gray-700">Unit</span>
                  <select
                    disabled={loadingUnits || units.length === 0}
                    value={form.unitNumber}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        unitNumber: Number(e.target.value),
                      }))
                    }
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#155ca5]"
                  >
                    {loadingUnits ? (
                      <option value={form.unitNumber || 0}>Loading units...</option>
                    ) : units.length === 0 ? (
                      <option value={form.unitNumber || 0}>No units found</option>
                    ) : (
                      units.map((unit) => (
                        <option key={unit.unitId} value={unit.unitNumber}>
                          Unit {unit.unitNumber} - {unit.unitTitle}
                        </option>
                      ))
                    )}
                  </select>
                </label>

                {selectedUnitProgress && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    Current unit progress:{" "}
                    <span className="font-bold text-[#155ca5]">
                      {Math.round(selectedUnitProgress.progressPercent)}%
                    </span>
                  </div>
                )}

                <div className="rounded-2xl border border-[#dbeafe] bg-[#f8fbff] p-4 text-sm text-[#1e2e51]">
                  AI practice is generated from your wrong-question history. If you have not made
                  mistakes yet in this unit, the backend may return no personalized set.
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-bold text-gray-700">Question Count</span>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={form.questionCount}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        questionCount: Math.max(1, Number(e.target.value) || 1),
                      }))
                    }
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#155ca5]"
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

          
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-3xl shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-2xl font-black text-[#1e2e51]">
                  AI Learning Insights
                </h2>
                <p className="text-sm text-gray-500">
                  Latest ML snapshot from `/api/ai/learning-analysis/me` and its history.
                </p>
              </div>
              {hasUnlockedMlInsights && analysis && (
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600">
                  <Clock3 className="w-4 h-4" />
                  {formatAnalysisDate(analysis.generatedAt)}
                </div>
              )}
            </div>

            {!hasUnlockedMlInsights ? (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
                  <div>
                    <div className="font-black text-amber-900">
                      ML insights are locked
                    </div>
                    <p className="mt-2 text-sm text-amber-800">
                      Hoàn thành ít nhất 1 unit rồi quay lại đây. Sau đó frontend mới mở quyền xem
                      thống kê ML của bạn, dù backend có thể đã sinh snapshot sớm hơn.
                    </p>
                  </div>
                </div>
              </div>
            ) : loadingAnalysis ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-500">
                <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                <div className="mt-3">Loading ML insights...</div>
              </div>
            ) : analysis ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-3xl border border-green-200 bg-green-50 p-5">
                    <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-green-700">
                      <BrainCircuit className="w-4 h-4" />
                      Strongest Skill
                    </div>
                    <div className="mt-3 text-2xl font-black text-green-900">
                      {analysis.strongSkill || "Not enough data"}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-red-200 bg-red-50 p-5">
                    <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-red-700">
                      <AlertTriangle className="w-4 h-4" />
                      Needs Improvement
                    </div>
                    <div className="mt-3 text-2xl font-black text-red-900">
                      {analysis.weakSkill || "Not enough data"}
                    </div>
                    {analysis.weakTopic && (
                      <div className="mt-2 text-sm text-red-700">
                        Weak topic: <span className="font-bold">{analysis.weakTopic}</span>
                      </div>
                    )}
                  </div>

                  <div className={`rounded-3xl border p-5 ${latestTrendMeta.tone}`}>
                    <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em]">
                      <LatestTrendIcon className="w-4 h-4" />
                      Learning Trend
                    </div>
                    <div className="mt-3 text-2xl font-black">
                      {latestTrendMeta.label}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-[#dbeafe] bg-[#f8fbff] p-5">
                  <div className="text-sm font-black uppercase tracking-[0.18em] text-[#155ca5]">
                    Recommendation
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[#1e2e51]">
                    {analysis.recommendation || "No recommendation available yet."}
                  </p>
                </div>
              </>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                Chưa có snapshot ML mới nhất. Hãy học thêm một chút rồi thử lại.
              </div>
            )}

            {hasUnlockedMlInsights && analysisHistory.length > 0 && (
              <div className="space-y-3">
                <div className="text-lg font-black text-[#1e2e51]">History</div>
                <div className="space-y-3">
                  {analysisHistory.map((item) => {
                    const trendMeta = getTrendMeta(item.trendLabel);
                    const TrendIcon = trendMeta.icon;

                    return (
                      <article
                        key={item.id}
                        className="rounded-3xl border border-slate-200 bg-white p-5"
                      >
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <div className="text-sm font-black text-[#1e2e51]">
                              {formatAnalysisDate(item.generatedAt)}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                              <span className="rounded-full bg-green-50 px-3 py-1 text-green-700">
                                Strong: {item.strongSkill || "N/A"}
                              </span>
                              <span className="rounded-full bg-red-50 px-3 py-1 text-red-700">
                                Weak: {item.weakSkill || "N/A"}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${trendMeta.tone}`}
                          >
                            <TrendIcon className="h-3.5 w-3.5" />
                            {trendMeta.label}
                          </span>
                        </div>

                        {(item.weakTopic || item.recommendation) && (
                          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                            {item.weakTopic && (
                              <div>
                                Weak topic: <span className="font-bold">{item.weakTopic}</span>
                              </div>
                            )}
                            {item.recommendation && (
                              <div className={item.weakTopic ? "mt-2" : ""}>
                                {item.recommendation}
                              </div>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          <section className="space-y-4">
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
                      <div className="font-black">Result</div>
                      <div className="mt-2 text-sm">
                        You got {correctCount}/{questions.length} correct.
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
                              Correct
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-red-800">
                            <div className="flex items-center gap-2 font-bold">
                              <XCircle className="w-4 h-4" />
                              Incorrect
                            </div>
                            <div className="mt-2 text-sm">
                              Correct answer:{" "}
                              {question.options?.find((option) => option.isCorrect)?.optionKey}.{" "}
                              {question.options?.find((option) => option.isCorrect)?.content}
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
                      Retry Mini Test
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleSubmitTest()}
                      disabled={submitting}
                      className="rounded-2xl bg-[#155ca5] px-5 py-3 font-bold text-white hover:bg-[#0f4c88] disabled:opacity-60"
                    >
                      {submitting ? "Submitting..." : "Submit Mini Test"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </section>

      <NotificationPopup {...popup.notification} onClose={popup.close} />
    </main>
  );
}
