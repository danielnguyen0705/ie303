import { useEffect, useMemo, useState } from "react";
import {
  Brain,
  CheckCircle2,
  Loader2,
  RefreshCcw,
  Sparkles,
  XCircle,
} from "lucide-react";
import {
  getPersonalizedQuestions,
  getUnitsByGradeProgress,
  submitQuestionHistory,
} from "@/api";
import { getAllGrades } from "@/api/admin";
import type { Grade } from "@/api/admin/types";
import type { QuestionDto } from "@/api/questions";
import type { PersonalizedQuestionsRequest } from "@/api/types";
import type { UnitProgressItem } from "@/api/units";
import { useLanguage } from "@/context/LanguageContext";
import { NotificationPopup } from "@/utils/NotificationPopup";
import { useNotificationPopup } from "@/utils/useNotificationPopup";
import { playUiSound } from "@/app/utils/audioSettings";

const RIGHT_SOUND_SRC = "/audio/right.wav";
const WRONG_SOUND_SRC = "/audio/false.wav";

const initialForm: PersonalizedQuestionsRequest = {
  questionCount: 10,  // Reduced from 20 to 10 for better API stability
  gradeId: 0,
  unitNumber: 0,
};

type CopyFn = (english: string, vietnamese: string) => string;

function getGenerationErrorMessage(message: string | undefined, copy: CopyFn) {
  if (!message) {
    return copy(
      "Could not generate questions. Please ensure you have wrong-answer history in this unit.",
      "Khong the tao cau hoi. Hay dam bao ban co lich su tra loi sai trong unit nay.",
    );
  }

  // Return messages from backend as-is (they're already in English)
  if (message.includes("No wrong-answer history available")) {
    return message;
  }

  if (message.includes("practice")) {
    return message;
  }

  if (message.includes("VIP subscription") || message.includes("This personalized question feature requires")) {
    return message;
  }

  if (message.includes("AI service is temporarily unavailable")) {
    return message;
  }

  if (message.includes("AI service is not configured")) {
    return message;
  }

  if (message.includes("AI service returned unexpected")) {
    return message;
  }

  // Legacy message handling (keep for backwards compatibility)
  if (message.includes("No wrong questions found")) {
    return copy(
      "No wrong-answer history available. Practice some questions and answer them incorrectly first.",
      "Chua co lich su tra loi sai. Hay luyen mot vai cau va tra loi sai truoc.",
    );
  }

  if (message.includes("No reusable multiple-choice wrong questions found")) {
    return copy(
      "This unit only has unsupported wrong-answer types. Please create wrong-answer history on multiple-choice questions first.",
      "Unit nay chi co cac dang cau sai chua duoc ho tro. Hay tao lich su sai voi cau trac nghiem truoc.",
    );
  }

  if (message.includes("No AI provider is configured")) {
    return copy(
      "AI service is not configured. System will use your wrong-answer history instead.",
      "Dich vu AI chua duoc cau hinh. He thong se dung lich su cau sai cua ban thay the.",
    );
  }

  if (message.includes("502")) {
    return copy(
      "AI service is temporarily unavailable. Please try again later.",
      "Dich vu AI dang tam thoi gian doan. Vui long thu lai sau.",
    );
  }

  // If message doesn't match any pattern, return it as-is
  return message;
}

// Helper: Check if option is the correct answer by comparing with stored correctAnswer
function isOptionCorrect(question: QuestionDto, option: QuestionDto["options"][0]) {
  // First try comparing with stored correctAnswer field
  if (question.correctAnswer && option.content) {
    const normalizedCorrect = question.correctAnswer.trim().toLowerCase();
    const normalizedOption = option.content.trim().toLowerCase();
    if (normalizedCorrect === normalizedOption) {
      return true;
    }
  }

  // Fallback to isCorrect flag
  return option.isCorrect ?? false;
}

function playAnswerFeedbackSound(correct: boolean) {
  playUiSound(correct ? RIGHT_SOUND_SRC : WRONG_SOUND_SRC);
}

export function PersonalizedQuestions() {
  const { copy } = useLanguage();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [units, setUnits] = useState<UnitProgressItem[]>([]);
  const [form, setForm] = useState<PersonalizedQuestionsRequest>(initialForm);
  const [questions, setQuestions] = useState<QuestionDto[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [flashcardMode, setFlashcardMode] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
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

      if (response.success && response.data) {
        const gradeList = response.data;
        setGrades(gradeList);

        const preferredGrade =
          gradeList.find((grade) => /\b11\b/.test(grade.name)) ?? gradeList[0];

        if (preferredGrade?.id) {
          setForm((prev) => ({ ...prev, gradeId: preferredGrade.id }));
        }
      } else {
        popup.error({
          title: copy("Load failed", "Tai that bai"),
          message: response.error?.message || copy("Could not load grades.", "Khong the tai lop hoc."),
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
          title: copy("Load failed", "Tai that bai"),
          message: response.error?.message || copy(
            "Could not load units for this grade.",
            "Khong the tai unit cho lop nay.",
          ),
        });
      }

      setLoadingUnits(false);
    };

    void loadUnits();
  }, [form.gradeId]);

  const selectedUnitProgress = useMemo(
    () => units.find((unit) => unit.unitNumber === form.unitNumber) || null,
    [form.unitNumber, units],
  );

  const correctCount = useMemo(
    () =>
      questions.filter((question) => {
        const answer = answers[question.id];
        const selected = question.options?.find((option, idx) => {
          const displayKey = option.optionKey || ["A","B","C","D"][idx] || String.fromCharCode(65 + idx);
          return displayKey === answer;
        });
        return Boolean(selected && isOptionCorrect(question, selected));
      }).length,
    [answers, questions],
  );

  const answeredCount = useMemo(
    () => questions.filter((question) => Boolean(answers[question.id])).length,
    [answers, questions],
  );

  const formatCorrectAnswer = (q: QuestionDto) => {
    const opt = q.options?.find((o) => isOptionCorrect(q, o));
    if (opt) {
      const key = opt.optionKey || (() => {
        const idx = q.options?.indexOf(opt) ?? -1;
        return idx >= 0 ? (["A","B","C","D"][idx] || String.fromCharCode(65 + idx)) : "";
      })();
      return `${key}${key ? ". " : ""}${opt.content || ""}`.trim();
    }
    if (q.correctAnswer) return q.correctAnswer;
    return "N/A";
  };

  const handleGenerate = async () => {
    if (!form.gradeId) {
      popup.warning({
        title: copy("Missing grade", "Chua chon lop"),
        message: copy(
          "Please choose a grade before generating questions.",
          "Vui long chon lop truoc khi tao cau hoi.",
        ),
      });
      return;
    }

    if (!form.unitNumber) {
      popup.warning({
        title: copy("Missing unit", "Chua chon unit"),
        message: copy(
          "Please choose a unit before generating questions.",
          "Vui long chon unit truoc khi tao cau hoi.",
        ),
      });
      return;
    }

    setGenerating(true);
    const response = await getPersonalizedQuestions(form);

    if (response.success && response.data) {
      setQuestions(response.data);
      setAnswers({});
      setCurrentIndex(0);
      setFlashcardMode(true);
      setSubmitted(false);

      // Log question data for debugging
      console.log("[Questions Generated]", response.data.length, "questions");
      response.data.forEach((q, idx) => {
        console.log(`Question ${idx + 1}:`, {
          id: q.id,
          content: q.content,
          correctAnswer: q.correctAnswer,
          options: q.options?.map(o => ({
            id: o.id,
            optionKey: o.optionKey,
            content: o.content,
            isCorrect: o.isCorrect
          }))
        });

        // Show raw full data
        console.log(`Full question ${q.id} raw data:`, q);
      });

      popup.success({
        title: copy("Generated", "Da tao"),
        message: copy(
          `Created ${response.data.length} personalized questions.`,
          `Da tao ${response.data.length} cau hoi ca nhan hoa.`,
        ),
      });
    } else {
      popup.error({
        title: copy("Generation failed", "Tao cau hoi that bai"),
        message: getGenerationErrorMessage(response.error?.message, copy),
      });
    }

    setGenerating(false);
  };

  const handleSubmitTest = async () => {
    const answeredQuestions = questions.filter((question) => Boolean(answers[question.id]));
    if (answeredQuestions.length === 0) {
      popup.warning({
        title: copy("No answers yet", "Chua co cau tra loi"),
        message: copy(
          "Choose at least one answer before submitting the mini test.",
          "Hay chon it nhat mot cau tra loi truoc khi nop bai mini test.",
        ),
      });
      return;
    }

    setSubmitting(true);
    await Promise.all(
      answeredQuestions.map(async (question) => {
        const selectedKey = answers[question.id];
        const selectedOption = question.options?.find((option, idx) => {
          const displayKey = option.optionKey || ["A","B","C","D"][idx] || String.fromCharCode(65 + idx);
          return displayKey === selectedKey;
        });
        if (!selectedOption) return;

        await submitQuestionHistory({
          questionId: question.id,
          answer_text: selectedOption.content,
        });
      }),
    );
    setSubmitted(true);
    const currentQuestion = questions[currentIndex];
    const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;
    const currentSelectedOption = currentQuestion?.options?.find((option, idx) => {
      const displayKey =
        option.optionKey ||
        ["A", "B", "C", "D"][idx] ||
        String.fromCharCode(65 + idx);
      return displayKey === currentAnswer;
    });
    if (currentQuestion && currentSelectedOption) {
      playAnswerFeedbackSound(
        isOptionCorrect(currentQuestion, currentSelectedOption),
      );
    }
    setSubmitting(false);
  };

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-6 py-10 pb-24 md:pb-12">
      <section className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#155ca5]/10 px-4 py-2 text-sm font-bold text-[#155ca5]">
          <Sparkles className="h-4 w-4" />
          {copy("AI Practice", "Luyen tap AI")}
        </div>
        <h1 className="text-4xl font-black tracking-tight text-[#155ca5] md:text-5xl">
          {copy("Personalized Questions", "Cau hoi ca nhan hoa")}
        </h1>
        <p className="max-w-3xl font-medium text-gray-600">
          {copy(
            "Use AI to generate extra practice questions from your wrong-answer history in a selected unit.",
            "Dung AI de tao cau hoi luyen tap them tu lich su tra loi sai cua ban trong unit da chon.",
          )}
        </p>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
        <div className="space-y-6">
          <div className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-lg font-black text-[#155ca5]">
              <Brain className="h-5 w-5" />
              {copy("Generate Set", "Tao bo cau hoi")}
            </div>

            {loadingGrades ? (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {copy("Loading grades...", "Dang tai lop...")}
              </div>
            ) : (
              <>
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-gray-700">{copy("Grade", "Lop")}</span>
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
                    {grades.length === 0 && (
                      <option value={0}>{copy("No grades available", "Khong co lop nao")}</option>
                    )}
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
                      <option value={form.unitNumber || 0}>{copy("Loading units...", "Dang tai unit...")}</option>
                    ) : units.length === 0 ? (
                      <option value={form.unitNumber || 0}>{copy("No units found", "Khong tim thay unit")}</option>
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
                    {copy("Current unit progress:", "Tien do unit hien tai:")}{" "}
                    <span className="font-bold text-[#155ca5]">
                      {Math.round(selectedUnitProgress.progressPercent)}%
                    </span>
                  </div>
                )}

                <div className="rounded-2xl border border-[#dbeafe] bg-[#f8fbff] p-4 text-sm text-[#1e2e51]">
                  {copy(
                    "AI practice is generated from your wrong-question history. Question count defaults to 10 (max 15), and if the external AI provider is down the backend falls back to a retry set built from your own missed questions.",
                    "Luyen tap AI duoc tao tu lich su cau sai cua ban. So cau mac dinh la 10 (toi da 15), va neu nha cung cap AI ben ngoai bi gian doan, backend se dung bo cau hoi lam lai tu cac cau ban da sai.",
                  )}
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-bold text-gray-700">
                    {copy("Question Count", "So cau hoi")}
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={form.questionCount}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        questionCount: Math.min(15, Math.max(1, Number(e.target.value) || 10)),
                      }))
                    }
                    onBlur={() =>
                      setForm((prev) => ({
                        ...prev,
                        questionCount: Math.min(15, Math.max(1, prev.questionCount || 10)),
                      }))
                    }
                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#155ca5]"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full rounded-2xl bg-[#155ca5] py-3 font-bold text-white hover:bg-[#0f4c88] disabled:opacity-60"
                >
                  {generating
                    ? copy("Generating...", "Dang tao...")
                    : copy("Generate Questions", "Tao cau hoi")}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-[#dbeafe] bg-[#f8fbff] p-6 text-[#1e2e51]">
          <div className="text-sm font-black uppercase tracking-[0.18em] text-[#155ca5]">
            {copy("How it works", "Cach hoat dong")}
          </div>
          <div className="mt-3 space-y-3 text-sm leading-7 text-slate-700">
            <p>
              {copy(
                "Pick a grade and a unit, then choose how many questions you want to generate.",
                "Chon lop va unit, sau do chon so cau hoi ban muon tao.",
              )}
            </p>
            <p>
              {copy(
                "The system uses your wrong-answer history in that unit to create a focused mini test around the knowledge you missed.",
                "He thong dung lich su tra loi sai trong unit do de tao mini test tap trung vao phan kien thuc ban con thieu.",
              )}
            </p>
            <p>
              {copy(
                "This page is only for AI-generated practice. ML learning insights are now shown separately on the dashboard for VIP users.",
                "Trang nay chi dung cho luyen tap do AI tao. Phan tich ML hien duoc hien rieng tren dashboard cho nguoi dung VIP.",
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-[#1e2e51]">
              {copy("Generated Result", "Ket qua da tao")}
            </h2>
            <p className="text-sm text-gray-500">
              {questions.length > 0
                ? copy(
                  `${questions.length} question(s) ready`,
                  `${questions.length} cau hoi san sang`,
                )
                : copy("No personalized questions yet", "Chua co cau hoi ca nhan hoa")}
            </p>
          </div>

          {questions.length > 0 && (
            <button
              type="button"
              onClick={() => setQuestions([])}
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
            >
              <RefreshCcw className="h-4 w-4" />
              {copy("Clear", "Xoa")}
            </button>
          )}
        </div>

        {questions.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center text-gray-500 shadow-sm">
            {copy(
              "Generate a set to start a personalized mini-test from your wrong-answer history.",
              "Tao mot bo cau hoi de bat dau mini test ca nhan hoa tu lich su cau sai cua ban.",
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black text-[#1e2e51]">
                    {copy("Personalized Mini Test", "Mini test ca nhan hoa")}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {copy(
                      "Answer each generated question, then submit the whole test.",
                      "Tra loi tung cau hoi da tao, sau do nop ca bai test.",
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-[#f8fbff] px-4 py-2 text-sm font-bold text-[#155ca5]">
                    {copy("Answered", "Da tra loi")} {answeredCount}/{questions.length}
                  </div>
                  <button
                    type="button"
                    onClick={() => setFlashcardMode((s) => !s)}
                    className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm font-bold text-gray-700 hover:bg-gray-50"
                  >
                    {flashcardMode ? copy("List view", "Dang danh sach") : copy("Flashcard", "The ghi nho")}
                  </button>
                </div>
              </div>
            </div>

            {flashcardMode ? (
              (() => {
                const question = questions[currentIndex];
                if (!question) return null;

                const revealed = Boolean(answers[question.id]);

                return (
                  <article key={question.id} className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="inline-flex rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#155ca5]">
                        {copy("Question", "Cau")} {currentIndex + 1} / {questions.length}
                      </span>
                      <span className="text-xs font-bold text-gray-500">{question.questionType}</span>
                    </div>

                    <h3 className="question-text-unified text-[#1e2e51]">
                      {question.content || copy("(No question text provided)", "(Chua co noi dung cau hoi)")}
                    </h3>

                    {question.options?.length > 0 && (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {question.options.map((option, optIndex) => {
                          const displayKey = option.optionKey || ["A","B","C","D"][optIndex] || String.fromCharCode(65 + optIndex);
                          const selected = answers[question.id] === displayKey;
                          const isCorrect = isOptionCorrect(question, option);
                          const resultClass = revealed
                            ? isCorrect
                              ? "border-green-300 bg-green-50"
                              : selected
                                ? "border-red-300 bg-red-50"
                                : "border-gray-200 bg-gray-50"
                            : selected
                              ? "border-[#155ca5] bg-[#eef6ff]"
                              : "border-gray-200 bg-gray-50 hover:border-[#155ca5]/40";

                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => {
                                setAnswers((prev) => ({ ...prev, [question.id]: displayKey }));
                                console.log(`[Option Clicked] optionKey='${option.optionKey}', displayKey='${displayKey}', isCorrect=${isCorrect}, content='${option.content}'`);
                              }}
                              className={`rounded-2xl border p-4 text-left transition ${resultClass}`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-sm font-bold text-gray-500">{displayKey}</div>
                                {revealed && isCorrect && <CheckCircle2 className="h-4 w-4 text-green-700" />}
                                {revealed && selected && !isCorrect && <XCircle className="h-4 w-4 text-red-700" />}
                              </div>
                              <div className="font-semibold text-[#1e2e51]">{option.content}</div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {revealed && (
                      <div className="space-y-3">
                        {question.options?.some((option, idx) => {
                          const displayKey = option.optionKey || ["A","B","C","D"][idx] || String.fromCharCode(65 + idx);
                          const isCorrect = isOptionCorrect(question, option);
                          const isMatch = displayKey === answers[question.id] && isCorrect;

                          console.log(`[Answer Check] Question ${question.id}:`);
                          console.log(`  displayKey='${displayKey}', userAnswer='${answers[question.id]}', isCorrect=${isCorrect}`);
                          console.log(`  Match: ${isMatch}`);

                          return isMatch;
                        }) ? (
                          <div className="rounded-2xl border border-green-300 bg-green-50 p-4 text-green-800">
                            <div className="flex items-center gap-2 font-bold">
                              <CheckCircle2 className="h-4 w-4" />
                              {copy("Correct", "Dung")}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-red-800">
                            <div className="flex items-center gap-2 font-bold">
                              <XCircle className="h-4 w-4" />
                              {copy("Incorrect", "Sai")}
                            </div>
                            <div className="mt-2 text-sm">
                              {copy("Correct answer:", "Dap an dung:")} {formatCorrectAnswer(question)}
                            </div>
                          </div>
                        )}

                        {question.explanation && <p className="rounded-2xl border border-[#dbeafe] bg-[#f8fbff] p-4 text-sm text-gray-700">{question.explanation}</p>}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} disabled={currentIndex === 0} className="rounded-2xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50">{copy("Previous", "Cau truoc")}</button>
                        <button type="button" onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))} disabled={currentIndex >= questions.length - 1} className="rounded-2xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50">{copy("Next", "Cau sau")}</button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => { const nextAnswers = { ...answers }; delete nextAnswers[question.id]; setAnswers(nextAnswers); }} className="rounded-2xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">{copy("Clear Answer", "Xoa cau tra loi")}</button>
                        <button type="button" onClick={() => setFlashcardMode(false)} className="rounded-2xl bg-[#155ca5] px-4 py-2 text-sm font-bold text-white hover:bg-[#0f4c88]">{copy("Finish & List", "Xong va xem danh sach")}</button>
                      </div>
                    </div>
                  </article>
                );
              })()
            ) : (
              questions.map((question, index) => (
                <article key={question.id} className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="inline-flex rounded-full bg-[#eef6ff] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#155ca5]">
                      {copy("Question", "Cau")} {index + 1}
                    </span>
                    <span className="text-xs font-bold text-gray-500">{question.questionType}</span>
                  </div>

                  <h3 className="question-text-unified text-[#1e2e51]">
                    {question.content || copy("(No question text provided)", "(Chua co noi dung cau hoi)")}
                  </h3>

                  {question.options?.length > 0 && (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {question.options.map((option, optIndex) => {
                        const displayKey = option.optionKey || ["A","B","C","D"][optIndex] || String.fromCharCode(65 + optIndex);
                        const selected = answers[question.id] === displayKey;
                        const isCorrect = isOptionCorrect(question, option);
                        const resultClass = submitted
                          ? isCorrect
                            ? "border-green-300 bg-green-50"
                            : selected
                              ? "border-red-300 bg-red-50"
                              : "border-gray-200 bg-gray-50"
                          : selected
                            ? "border-[#155ca5] bg-[#eef6ff]"
                            : "border-gray-200 bg-gray-50 hover:border-[#155ca5]/40";

                        return (
                          <button key={option.id} type="button" disabled={submitted} onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: displayKey }))} className={`rounded-2xl border p-4 text-left transition ${resultClass}`}>
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm font-bold text-gray-500">{displayKey}</div>
                              {submitted && isCorrect && <CheckCircle2 className="h-4 w-4 text-green-700" />}
                              {submitted && selected && !isCorrect && <XCircle className="h-4 w-4 text-red-700" />}
                            </div>
                            <div className="font-semibold text-[#1e2e51]">{option.content}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {submitted && (
                    <div className="space-y-3">
                      {question.options?.some((option, idx) => {
                        const displayKey = option.optionKey || ["A","B","C","D"][idx] || String.fromCharCode(65 + idx);
                        return displayKey === answers[question.id] && isOptionCorrect(question, option);
                      }) ? (
                        <div className="rounded-2xl border border-green-300 bg-green-50 p-4 text-green-800">
                          <div className="flex items-center gap-2 font-bold">
                            <CheckCircle2 className="h-4 w-4" />
                            {copy("Correct", "Dung")}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-red-800">
                          <div className="flex items-center gap-2 font-bold">
                            <XCircle className="h-4 w-4" />
                            {copy("Incorrect", "Sai")}
                          </div>
                          <div className="mt-2 text-sm">
                            {copy("Correct answer:", "Dap an dung:")} {formatCorrectAnswer(question)}
                          </div>
                        </div>
                      )}

                      {question.explanation && <p className="rounded-2xl border border-[#dbeafe] bg-[#f8fbff] p-4 text-sm text-gray-700">{question.explanation}</p>}
                    </div>
                  )}
                </article>
              ))
            )}

            <div className="flex items-center justify-end gap-3">
              {submitted ? (
                <button type="button" onClick={() => { setAnswers({}); setSubmitted(false); }} className="rounded-2xl border border-gray-300 px-5 py-3 font-bold text-gray-700 hover:bg-gray-50">{copy("Retry Mini Test", "Lam lai mini test")}</button>
              ) : (
                <button type="button" onClick={() => void handleSubmitTest()} disabled={submitting} className="rounded-2xl bg-[#155ca5] px-5 py-3 font-bold text-white hover:bg-[#0f4c88] disabled:opacity-60">{submitting ? copy("Submitting...", "Dang nop...") : copy("Submit Mini Test", "Nop mini test")}</button>
              )}
            </div>
          </div>
        )}
      </section>

      <NotificationPopup {...popup.notification} onClose={popup.close} />
    </main>
  );
}
