import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Loader2,
  PlayCircle,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { submitEssay, submitQuestionHistory } from "@/api";
import { ENV } from "@/config/env";
import type { QuestionDto, QuestionGroupDto, QuestionType } from "@/api/questions";

type UserAnswer = string | string[] | Record<string, string>;

type StoredAnswer = {
  answer: UserAnswer;
  submitted: boolean;
  correct: boolean | null;
  feedback?: string | null;
  score?: number | null;
};

type AnswerState = Record<number, StoredAnswer>;

type AttemptResult = {
  answeredCount: number;
  gradedCount: number;
  correctCount: number;
  scorePercent: number;
};

type LoadedPracticePackage<TItem> = {
  selected: TItem;
  questions: QuestionDto[];
  questionGroups: Record<number, QuestionGroupDto>;
};

type PracticePackageRunnerProps<TItem extends { id: number; title: string }> = {
  badgeLabel: string;
  pageTitle: string;
  pageDescription: string;
  packageKindLabel: string;
  introText: string;
  emptyListText: string;
  emptyQuestionsText: string;
  startButtonLabel?: string;
  loadItems: () => Promise<{ items: TItem[]; error?: string | null }>;
  loadPackage: (item: TItem) => Promise<LoadedPracticePackage<TItem>>;
  getItemMeta: (item: TItem) => string;
  getResultMeta?: (item: TItem) => string | null;
};

function getQuestionTypeLabel(type: QuestionType) {
  switch (type) {
    case "QUALITATIVE_MC":
      return "Multiple Choice";
    case "READING_MC":
      return "Reading Question";
    case "CLOZE_MC":
      return "Cloze Question";
    case "TRUE_FALSE_NG":
      return "True / False / Not Given";
    case "WORD_BANK_FILL":
      return "Word Bank Fill";
    case "LIMITED_FILL":
      return "Fill in the Blank";
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
      return "Speaking";
    default:
      return type;
  }
}

function isMCQ(type: QuestionType) {
  return ["QUALITATIVE_MC", "READING_MC", "CLOZE_MC"].includes(type);
}

function isFillType(type: QuestionType) {
  return ["WORD_BANK_FILL", "LIMITED_FILL", "WORD_FORM", "VERB_FORM"].includes(type);
}

function isManualType(type: QuestionType) {
  return ["SENTENCE_REWRITE", "ESSAY_WRITING", "PRONUNCIATION", "TOPIC_SPEAKING"].includes(
    type,
  );
}

function normalizeText(value: string) {
  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function getTrueFalseExpected(question: QuestionDto) {
  const correctOption = question.options.find((option) => option.isCorrect);
  return normalizeText(String(correctOption?.content || question.correctAnswer || ""));
}

function parseJsonSafe<T>(value?: string | null): T | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function resolveMediaUrl(value?: string | null): string | null {
  if (!value) return null;

  const normalized = value.trim().replace(/\\/g, "/");
  if (!normalized) return null;

  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(normalized)) {
    return normalized;
  }

  try {
    const path = normalized.startsWith("/") ? normalized : `/${normalized}`;
    return new URL(path, ENV.BACKEND_BASE_URL).toString();
  } catch {
    return normalized;
  }
}

function renderTextWithBreaks(value?: string | null) {
  if (!value?.trim()) return null;

  return value.split("\n").map((line, index) => (
    <p key={`${line}-${index}`} className={index > 0 ? "mt-2" : undefined}>
      {line || "\u00A0"}
    </p>
  ));
}

function formatQuestionLabel(question: QuestionDto): string {
  return (
    question.content?.trim() ||
    question.instruction?.trim() ||
    `Question #${question.id}`
  );
}

function getDisplayAnswer(answer: UserAnswer | undefined): string {
  if (typeof answer === "string") {
    return answer.trim();
  }

  if (Array.isArray(answer)) {
    return answer
      .map((item) => item.split("|||")[1] ?? item)
      .join(" ")
      .trim();
  }

  if (answer && typeof answer === "object") {
    return Object.entries(answer)
      .map(([left, right]) => `${left} -> ${right}`)
      .join(", ");
  }

  return "";
}

function getExpectedAnswerLabel(question: QuestionDto): string {
  if (isMCQ(question.questionType)) {
    const option = question.options.find((item) => item.isCorrect);
    if (option) {
      return `${option.optionKey}. ${option.content}`;
    }
  }

  if (question.questionType === "MATCHING") {
    const answerMap = parseJsonSafe<Record<string, string>>(question.correctAnswer || "");
    if (answerMap) {
      return Object.entries(answerMap)
        .map(([left, right]) => `${left} -> ${right}`)
        .join(", ");
    }
  }

  return question.correctAnswer?.trim() || "No answer provided";
}

function getQuestionStatusClasses(questionId: number, answers: AnswerState, hasResult: boolean) {
  const saved = answers[questionId];

  if (!saved || !saved.submitted) {
    return hasResult
      ? "border-slate-200 bg-slate-100 text-slate-500"
      : "border-slate-200 bg-white text-slate-600 hover:border-[#155ca5]/40";
  }

  if (saved.correct === true) {
    return "border-green-300 bg-green-50 text-green-700";
  }

  if (saved.correct === false) {
    return "border-red-300 bg-red-50 text-red-700";
  }

  return "border-amber-300 bg-amber-50 text-amber-700";
}

export function PracticePackageRunner<TItem extends { id: number; title: string }>({
  badgeLabel,
  pageTitle,
  pageDescription,
  packageKindLabel,
  introText,
  emptyListText,
  emptyQuestionsText,
  startButtonLabel = "Start Practice",
  loadItems,
  loadPackage,
  getItemMeta,
  getResultMeta,
}: PracticePackageRunnerProps<TItem>) {
  const [items, setItems] = useState<TItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<TItem | null>(null);
  const [questions, setQuestions] = useState<QuestionDto[]>([]);
  const [questionGroups, setQuestionGroups] = useState<Record<number, QuestionGroupDto>>({});
  const [answers, setAnswers] = useState<AnswerState>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      const response = await loadItems();

      if (response.error) {
        setError(response.error);
        setItems([]);
        setSelectedItem(null);
      } else {
        setItems(response.items);
        setSelectedItem(response.items[0] ?? null);
      }

      setLoading(false);
    };

    void run();
  }, [loadItems]);

  useEffect(() => {
    const run = async () => {
      if (!selectedItem) {
        setQuestions([]);
        setQuestionGroups({});
        return;
      }

      setLoadingQuestions(true);

      try {
        const bundle = await loadPackage(selectedItem);
        setSelectedItem(bundle.selected);
        setQuestions(bundle.questions);
        setQuestionGroups(bundle.questionGroups);
        setAnswers({});
        setCurrentQuestionIndex(0);
        setHasStarted(false);
        setResult(null);
      } catch {
        setQuestions([]);
        setQuestionGroups({});
      } finally {
        setLoadingQuestions(false);
      }
    };

    void run();
  }, [loadPackage, selectedItem?.id]);

  const currentQuestion = questions[currentQuestionIndex] ?? null;
  const currentGroup =
    currentQuestion?.questionGroupId != null
      ? questionGroups[currentQuestion.questionGroupId] ?? null
      : null;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const groupData = useMemo(
    () => parseJsonSafe<Record<string, unknown>>(currentGroup?.groupData),
    [currentGroup?.groupData],
  );
  const questionData = useMemo(
    () => parseJsonSafe<Record<string, unknown>>(currentQuestion?.questionData),
    [currentQuestion?.questionData],
  );
  const isLocked = Boolean(result);

  const wordBank = useMemo(() => {
    const groupWords = groupData?.wordBank;
    if (Array.isArray(groupWords)) {
      return groupWords.map(String);
    }

    const questionWords = questionData?.wordBank;
    if (Array.isArray(questionWords)) {
      return questionWords.map(String);
    }

    return [];
  }, [groupData, questionData]);

  const reorderWords = useMemo(() => {
    if (!currentQuestion || currentQuestion.questionType !== "SENTENCE_REORDER") {
      return [];
    }

    if (currentQuestion.questionData?.includes("/")) {
      return currentQuestion.questionData
        .split("/")
        .map((word) => word.trim())
        .filter(Boolean);
    }

    if (Array.isArray(questionData?.words)) {
      return questionData.words.map(String);
    }

    return [];
  }, [currentQuestion, questionData]);

  const matchingData = useMemo(() => {
    if (!currentQuestion || currentQuestion.questionType !== "MATCHING") {
      return null;
    }

    const parsedQuestionData = parseJsonSafe<{
      left?: string[];
      right?: string[];
      answers?: Record<string, string>;
    }>(currentQuestion.questionData);

    if (parsedQuestionData) {
      return parsedQuestionData;
    }

    return parseJsonSafe<{
      left?: string[];
      right?: string[];
      answers?: Record<string, string>;
    }>(currentGroup?.groupData);
  }, [currentGroup?.groupData, currentQuestion]);

  const answeredCount = useMemo(() => {
    return questions.filter((question) => {
      const saved = answers[question.id];
      if (!saved) return false;

      if (typeof saved.answer === "string") {
        return saved.answer.trim().length > 0;
      }

      if (Array.isArray(saved.answer)) {
        return saved.answer.length > 0;
      }

      if (saved.answer && typeof saved.answer === "object") {
        return Object.keys(saved.answer).length > 0;
      }

      return false;
    }).length;
  }, [answers, questions]);

  const setAnswer = (questionId: number, answer: UserAnswer) => {
    if (isLocked) return;

    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        answer,
        submitted: false,
        correct: null,
        feedback: null,
        score: null,
      },
    }));
  };

  const getMatchingDataForQuestion = (question: QuestionDto) => {
    if (question.questionType !== "MATCHING") {
      return null;
    }

    const parsedQuestionData = parseJsonSafe<{
      left?: string[];
      right?: string[];
      answers?: Record<string, string>;
    }>(question.questionData);

    if (parsedQuestionData) {
      return parsedQuestionData;
    }

    const group =
      question.questionGroupId != null ? questionGroups[question.questionGroupId] ?? null : null;

    return parseJsonSafe<{
      left?: string[];
      right?: string[];
      answers?: Record<string, string>;
    }>(group?.groupData);
  };

  const appendWordBankWord = (word: string) => {
    if (!currentQuestion || isLocked) return;

    const current = answers[currentQuestion.id]?.answer;
    const text = typeof current === "string" ? current : "";
    const next = text.trim() ? `${text} ${word}` : word;
    setAnswer(currentQuestion.id, next);
  };

  const appendReorderWord = (word: string, index: number) => {
    if (!currentQuestion || isLocked) return;

    const current = answers[currentQuestion.id]?.answer;
    const selected = Array.isArray(current) ? current : [];
    const token = `${index}|||${word}`;

    if (selected.includes(token)) return;

    setAnswer(currentQuestion.id, [...selected, token]);
  };

  const removeLastReorderWord = () => {
    if (!currentQuestion || isLocked) return;

    const current = answers[currentQuestion.id]?.answer;
    const selected = Array.isArray(current) ? current : [];
    setAnswer(currentQuestion.id, selected.slice(0, -1));
  };

  const resetReorderAnswer = () => {
    if (!currentQuestion || isLocked) return;
    setAnswer(currentQuestion.id, []);
  };

  const updateMatchingAnswer = (leftItem: string, selectedRight: string) => {
    if (!currentQuestion || isLocked) return;

    const current = answers[currentQuestion.id]?.answer;
    const next =
      current && typeof current === "object" && !Array.isArray(current)
        ? { ...current, [leftItem]: selectedRight }
        : { [leftItem]: selectedRight };

    setAnswer(currentQuestion.id, next);
  };

  const getDisplayedReorderSentence = (question: QuestionDto, answer?: UserAnswer) => {
    if (question.questionType !== "SENTENCE_REORDER") {
      return "";
    }

    const selected = Array.isArray(answer) ? answer : [];
    return selected
      .map((item) => item.split("|||")[1] ?? "")
      .join(" ")
      .trim();
  };

  const canSubmitAnswer = (question: QuestionDto, saved?: StoredAnswer) => {
    if (!saved) return false;

    const answer = saved.answer;

    if (typeof answer === "string") {
      return answer.trim().length > 0;
    }

    if (Array.isArray(answer)) {
      return answer.length > 0;
    }

    if (typeof answer === "object" && answer !== null) {
      if (question.questionType === "MATCHING") {
        const leftItems = getMatchingDataForQuestion(question)?.left ?? [];
        if (leftItems.length === 0) {
          return Object.keys(answer).length > 0;
        }

        return leftItems.every(
          (leftItem) =>
            typeof answer[leftItem] === "string" && String(answer[leftItem]).trim().length > 0,
        );
      }

      return Object.keys(answer).length > 0;
    }

    return false;
  };

  const toAnswerText = (answer: UserAnswer, question: QuestionDto) => {
    if (typeof answer === "string") {
      if (isMCQ(question.questionType)) {
        const normalizedAnswer = normalizeText(answer);
        const selectedOption = question.options.find(
          (option) =>
            normalizeText(option.optionKey) === normalizedAnswer ||
            normalizeText(option.content) === normalizedAnswer,
        );

        return (selectedOption?.content || answer).trim();
      }

      return answer.trim();
    }

    if (Array.isArray(answer)) {
      return answer
        .map((item) => {
          const [, value] = item.split("|||");
          return value ?? item;
        })
        .join(" ")
        .trim();
    }

    return JSON.stringify(answer);
  };

  const evaluateAnswer = (question: QuestionDto, answer: UserAnswer): boolean | null => {
    if (isMCQ(question.questionType)) {
      const selected = normalizeText(String(answer));
      const correctOption = question.options.find((option) => option.isCorrect);
      return correctOption
        ? normalizeText(correctOption.optionKey) === selected ||
            normalizeText(correctOption.content) === selected
        : false;
    }

    if (question.questionType === "TRUE_FALSE_NG") {
      return normalizeText(String(answer)) === getTrueFalseExpected(question);
    }

    if (isFillType(question.questionType)) {
      return normalizeText(String(answer)) === normalizeText(String(question.correctAnswer ?? ""));
    }

    if (question.questionType === "SENTENCE_REORDER") {
      const builtSentence = getDisplayedReorderSentence(question, answer);
      return normalizeText(builtSentence) === normalizeText(String(question.correctAnswer ?? ""));
    }

    if (question.questionType === "MATCHING") {
      const answerMap =
        answer && typeof answer === "object" && !Array.isArray(answer) ? answer : {};
      const matching = getMatchingDataForQuestion(question);
      const expectedMap =
        parseJsonSafe<Record<string, string>>(question.correctAnswer || "") ||
        matching?.answers ||
        null;

      if (!expectedMap) {
        return null;
      }

      return Object.keys(expectedMap).every(
        (left) => normalizeText(answerMap[left] || "") === normalizeText(expectedMap[left] || ""),
      );
    }

    if (isManualType(question.questionType)) {
      return null;
    }

    return normalizeText(String(answer)) === normalizeText(String(question.correctAnswer ?? ""));
  };

  const startAttempt = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setResult(null);
    setHasStarted(true);
  };

  const backToOverview = () => {
    setHasStarted(false);
    setCurrentQuestionIndex(0);
    setResult(null);
  };

  const submitAttempt = async () => {
    if (questions.length === 0) {
      return;
    }

    setSubmitting(true);
    const nextAnswers: AnswerState = { ...answers };

    const answeredQuestions = questions.filter((question) =>
      canSubmitAnswer(question, answers[question.id]),
    );

    await Promise.all(
      answeredQuestions.map(async (question) => {
        const saved = answers[question.id];
        if (!saved) return;

        let correct = evaluateAnswer(question, saved.answer);
        let feedback: string | null = null;
        let score: number | null = null;
        const answerText = toAnswerText(saved.answer, question);
        const evaluatedCorrect = correct;

        if (question.questionType === "ESSAY_WRITING") {
          const response = await submitEssay({
            questionId: question.id,
            answerText,
          });

          if (response.success && response.data) {
            correct = null;
            feedback = response.data.feedback;
            score = response.data.score;
          }
        } else {
          const response = await submitQuestionHistory({
            questionId: question.id,
            answer_text: answerText,
          });

          if (response.success && response.data) {
            correct = evaluatedCorrect;
          }
        }

        nextAnswers[question.id] = {
          ...saved,
          submitted: true,
          correct,
          feedback,
          score,
        };
      }),
    );

    setAnswers(nextAnswers);

    const gradedAnswers = Object.values(nextAnswers).filter(
      (answer) => answer.submitted && answer.correct !== null,
    );
    const correctCount = gradedAnswers.filter((answer) => answer.correct === true).length;

    setResult({
      answeredCount: answeredQuestions.length,
      gradedCount: gradedAnswers.length,
      correctCount,
      scorePercent:
        gradedAnswers.length > 0 ? Math.round((correctCount / gradedAnswers.length) * 100) : 0,
    });
    setSubmitting(false);
  };

  const renderMedia = () => {
    const imageUrl = resolveMediaUrl(currentQuestion?.imageUrl || currentGroup?.imageUrl);
    const audioUrl = resolveMediaUrl(currentQuestion?.audioUrl || currentGroup?.audioUrl);

    if (!imageUrl && !audioUrl) {
      return null;
    }

    return (
      <div className="space-y-4">
        {imageUrl && (
          <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50">
            <img
              src={imageUrl}
              alt="question media"
              className="max-h-[360px] w-full object-contain"
            />
          </div>
        )}

        {audioUrl && (
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4">
            <div className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-[#155ca5]">
              Audio
            </div>
            <audio controls className="w-full">
              <source src={audioUrl} />
            </audio>
          </div>
        )}
      </div>
    );
  };

  const renderAnswerArea = () => {
    if (!currentQuestion) {
      return null;
    }

    if (isMCQ(currentQuestion.questionType)) {
      const selectedAnswer =
        typeof currentAnswer?.answer === "string" ? currentAnswer.answer : undefined;

      return (
        <div className="grid gap-4 md:grid-cols-2">
          {currentQuestion.options.map((option) => {
            const selected = selectedAnswer === option.optionKey;
            const isCorrectOption = option.isCorrect;

            let extraClass =
              "border-slate-200 bg-white hover:border-[#155ca5]/40 hover:bg-[#f7fbff]";

            if (isLocked) {
              if (isCorrectOption) {
                extraClass = "border-green-300 bg-green-50";
              } else if (selected) {
                extraClass = "border-red-300 bg-red-50";
              }
            } else if (selected) {
              extraClass = "border-[#155ca5] bg-[#f3f8ff]";
            }

            return (
              <button
                key={option.id}
                type="button"
                disabled={isLocked}
                onClick={() => setAnswer(currentQuestion.id, option.optionKey)}
                className={`rounded-[1.5rem] border-2 p-5 text-left transition-all ${extraClass}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white font-black text-[#1e2e51]">
                    {option.optionKey}
                  </div>
                  <div className="font-semibold text-[#1e2e51]">{option.content}</div>
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    if (currentQuestion.questionType === "TRUE_FALSE_NG") {
      const selectedAnswer =
        typeof currentAnswer?.answer === "string" ? currentAnswer.answer : undefined;
      const values = ["true", "false", "not given"];

      return (
        <div className="grid gap-4 md:grid-cols-3">
          {values.map((value) => {
            const selected = normalizeText(selectedAnswer || "") === normalizeText(value);
            const expected = getTrueFalseExpected(currentQuestion);

            let extraClass =
              "border-slate-200 bg-white hover:border-[#155ca5]/40 hover:bg-[#f7fbff]";

            if (isLocked) {
              if (normalizeText(value) === expected) {
                extraClass = "border-green-300 bg-green-50";
              } else if (selected) {
                extraClass = "border-red-300 bg-red-50";
              }
            } else if (selected) {
              extraClass = "border-[#155ca5] bg-[#f3f8ff]";
            }

            return (
              <button
                key={value}
                type="button"
                disabled={isLocked}
                onClick={() => setAnswer(currentQuestion.id, value)}
                className={`rounded-[1.5rem] border-2 p-5 font-black uppercase tracking-wide transition-all ${extraClass}`}
              >
                {value}
              </button>
            );
          })}
        </div>
      );
    }

    if (
      currentQuestion.questionType === "LIMITED_FILL" ||
      currentQuestion.questionType === "WORD_FORM" ||
      currentQuestion.questionType === "VERB_FORM"
    ) {
      return (
        <input
          type="text"
          disabled={isLocked}
          value={typeof currentAnswer?.answer === "string" ? currentAnswer.answer : ""}
          onChange={(event) => setAnswer(currentQuestion.id, event.target.value)}
          placeholder="Type your answer here..."
          className="w-full rounded-[1.5rem] border border-slate-300 px-5 py-4 text-lg text-[#1e2e51] outline-none transition focus:border-[#155ca5]"
        />
      );
    }

    if (currentQuestion.questionType === "WORD_BANK_FILL") {
      return (
        <div className="space-y-4">
          {wordBank.length > 0 && (
            <div className="rounded-[1.5rem] border border-[#cfe3ff] bg-[#f5f9ff] p-5">
              <div className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-[#155ca5]">
                Word Bank
              </div>
              <div className="flex flex-wrap gap-2">
                {wordBank.map((word) => (
                  <button
                    key={word}
                    type="button"
                    disabled={isLocked}
                    onClick={() => appendWordBankWord(word)}
                    className="rounded-full border border-[#b9d4ff] bg-white px-4 py-2 font-semibold text-[#155ca5] transition hover:bg-[#edf5ff] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>
          )}

          <input
            type="text"
            disabled={isLocked}
            value={typeof currentAnswer?.answer === "string" ? currentAnswer.answer : ""}
            onChange={(event) => setAnswer(currentQuestion.id, event.target.value)}
            placeholder="Fill from the word bank or type directly..."
            className="w-full rounded-[1.5rem] border border-slate-300 px-5 py-4 text-lg text-[#1e2e51] outline-none transition focus:border-[#155ca5]"
          />
        </div>
      );
    }

    if (currentQuestion.questionType === "SENTENCE_REORDER") {
      const selectedTokens = Array.isArray(currentAnswer?.answer) ? currentAnswer.answer : [];

      return (
        <div className="space-y-5">
          <div className="rounded-[1.5rem] border border-[#cfe3ff] bg-[#f5f9ff] p-5">
            <div className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-[#155ca5]">
              Your Sentence
            </div>
            <div className="min-h-[72px] rounded-[1.25rem] border border-dashed border-[#9dc1ff] bg-white p-4 text-lg font-semibold text-[#1e2e51]">
              {getDisplayedReorderSentence(currentQuestion, currentAnswer?.answer) ||
                "Build your sentence here"}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={isLocked || selectedTokens.length === 0}
                onClick={removeLastReorderWord}
                className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Undo
              </button>
              <button
                type="button"
                disabled={isLocked || selectedTokens.length === 0}
                onClick={resetReorderAnswer}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>

          <div>
            <div className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-slate-500">
              Available Words
            </div>
            <div className="flex flex-wrap gap-3">
              {reorderWords.map((word, index) => {
                const token = `${index}|||${word}`;
                const selected = selectedTokens.includes(token);

                return (
                  <button
                    key={token}
                    type="button"
                    disabled={isLocked || selected}
                    onClick={() => appendReorderWord(word, index)}
                    className={`rounded-xl border px-4 py-2 font-semibold transition-all ${
                      selected
                        ? "border-slate-300 bg-slate-100 text-slate-400"
                        : "border-[#bdd6ff] bg-white text-[#155ca5] hover:bg-[#eef6ff]"
                    }`}
                  >
                    {word}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    if (currentQuestion.questionType === "MATCHING") {
      const leftItems = matchingData?.left ?? [];
      const rightItems = matchingData?.right ?? [];
      const answerMap =
        currentAnswer?.answer &&
        typeof currentAnswer.answer === "object" &&
        !Array.isArray(currentAnswer.answer)
          ? currentAnswer.answer
          : {};

      return (
        <div className="space-y-4">
          {leftItems.map((leftItem) => {
            const selectedRight = answerMap[leftItem] || "";
            return (
              <div
                key={leftItem}
                className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 md:grid-cols-[minmax(0,1fr)_260px]"
              >
                <div className="font-semibold text-[#1e2e51]">{leftItem}</div>
                <select
                  disabled={isLocked}
                  value={selectedRight}
                  onChange={(event) => updateMatchingAnswer(leftItem, event.target.value)}
                  className="rounded-[1rem] border border-slate-300 bg-white px-4 py-3 text-[#1e2e51] outline-none transition focus:border-[#155ca5]"
                >
                  <option value="">Choose a match</option>
                  {rightItems.map((rightItem) => (
                    <option key={`${leftItem}-${rightItem}`} value={rightItem}>
                      {rightItem}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <textarea
        rows={6}
        disabled={isLocked}
        value={typeof currentAnswer?.answer === "string" ? currentAnswer.answer : ""}
        onChange={(event) => setAnswer(currentQuestion.id, event.target.value)}
        placeholder="Write your answer here..."
        className="w-full rounded-[1.5rem] border border-slate-300 px-5 py-4 text-base text-[#1e2e51] outline-none transition focus:border-[#155ca5]"
      />
    );
  };

  const renderFeedback = () => {
    if (!currentQuestion || !result) {
      return null;
    }

    const saved = answers[currentQuestion.id];
    if (!saved?.submitted) {
      return (
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          You did not answer this question in the attempt.
        </div>
      );
    }

    const answerText = getDisplayAnswer(saved.answer);
    const expectedAnswer = getExpectedAnswerLabel(currentQuestion);

    return (
      <div className="space-y-4">
        {saved.correct === true && (
          <div className="rounded-[1.5rem] border border-green-300 bg-green-50 p-5 text-green-800">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em]">
              <CheckCircle2 className="h-4 w-4" />
              Correct
            </div>
            {answerText && <div className="mt-3 font-semibold">Your answer: {answerText}</div>}
          </div>
        )}

        {saved.correct === false && (
          <div className="rounded-[1.5rem] border border-red-300 bg-red-50 p-5 text-red-800">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em]">
              <XCircle className="h-4 w-4" />
              Incorrect
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <div>
                <span className="font-black">Your answer:</span> {answerText || "No answer"}
              </div>
              <div>
                <span className="font-black">Correct answer:</span> {expectedAnswer}
              </div>
            </div>
          </div>
        )}

        {saved.correct === null && (
          <div className="rounded-[1.5rem] border border-amber-300 bg-amber-50 p-5 text-amber-900">
            <div className="text-sm font-black uppercase tracking-[0.2em]">Submitted</div>
            <div className="mt-3 space-y-2 text-sm">
              {answerText && (
                <div>
                  <span className="font-black">Your answer:</span> {answerText}
                </div>
              )}
              {saved.score != null && (
                <div>
                  <span className="font-black">Score:</span> {saved.score}
                </div>
              )}
              {saved.feedback && (
                <div>
                  <span className="font-black">Feedback:</span> {saved.feedback}
                </div>
              )}
            </div>
          </div>
        )}

        {currentQuestion.explanation && (
          <div className="rounded-[1.5rem] border border-[#cfe3ff] bg-[#f5f9ff] p-5 text-sm text-[#1e2e51]">
            <div className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-[#155ca5]">
              Explanation
            </div>
            {renderTextWithBreaks(currentQuestion.explanation)}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-6 py-10">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#155ca5]" />
          <p className="font-medium text-slate-600">Loading packages...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-bold text-red-600">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-6 py-10 pb-24 md:pb-12">
      <section className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#155ca5]/10 px-4 py-2 text-sm font-bold text-[#155ca5]">
          <BookOpenCheck className="h-4 w-4" />
          {badgeLabel}
        </div>
        <h1 className="text-4xl font-black tracking-tight text-[#155ca5] md:text-5xl">
          {pageTitle}
        </h1>
        <p className="max-w-3xl text-slate-600">{pageDescription}</p>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_1fr]">
        <aside className="space-y-3">
          {items.map((item) => {
            const isActive = item.id === selectedItem?.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedItem(item)}
                className={`w-full rounded-[2rem] border p-5 text-left transition-all ${
                  isActive
                    ? "border-[#155ca5] bg-[#f8fbff] shadow-sm"
                    : "border-slate-200 bg-white hover:border-[#155ca5]/30"
                }`}
              >
                <div className="font-black text-[#1e2e51]">{item.title}</div>
                <div className="mt-2 text-sm text-slate-500">{getItemMeta(item)}</div>
              </button>
            );
          })}
        </aside>

        <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          {selectedItem ? (
            loadingQuestions ? (
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                Loading package...
              </div>
            ) : !hasStarted ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-3xl font-black text-[#1e2e51]">
                      {selectedItem.title}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      {getItemMeta(selectedItem)} - {questions.length} question(s)
                    </p>
                  </div>
                  <div className="rounded-full bg-[#155ca5]/10 px-4 py-2 text-sm font-bold text-[#155ca5]">
                    {packageKindLabel} #{selectedItem.id}
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-[#dbeafe] bg-[#f8fbff] p-6 text-[#1e2e51]">
                  {introText}
                </div>

                <button
                  type="button"
                  onClick={startAttempt}
                  disabled={questions.length === 0}
                  className="inline-flex items-center gap-2 rounded-full bg-[#155ca5] px-6 py-3 text-sm font-black text-white transition hover:bg-[#0f4c88] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <PlayCircle className="h-4 w-4" />
                  {startButtonLabel}
                </button>
              </div>
            ) : currentQuestion ? (
              <div className="space-y-6">
                {result && (
                  <div className="space-y-5 rounded-[1.75rem] border border-[#dbeafe] bg-[#f8fbff] p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full bg-[#27ae60]/10 px-4 py-2 text-sm font-bold text-[#27ae60]">
                        <CheckCircle2 className="h-4 w-4" />
                        Attempt Submitted
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={backToOverview}
                          className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                        >
                          Back to Packages
                        </button>
                        <button
                          type="button"
                          onClick={startAttempt}
                          className="rounded-full bg-[#155ca5] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#0f4c88]"
                        >
                          Retry This Package
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="rounded-[1.5rem] border border-white/70 bg-white p-5">
                        <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                          Answered
                        </div>
                        <div className="mt-3 text-3xl font-black text-[#1e2e51]">
                          {result.answeredCount}
                        </div>
                      </div>
                      <div className="rounded-[1.5rem] border border-white/70 bg-white p-5">
                        <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                          Auto Graded
                        </div>
                        <div className="mt-3 text-3xl font-black text-[#1e2e51]">
                          {result.gradedCount}
                        </div>
                      </div>
                      <div className="rounded-[1.5rem] border border-white/70 bg-white p-5">
                        <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                          Correct
                        </div>
                        <div className="mt-3 text-3xl font-black text-[#27ae60]">
                          {result.correctCount}
                        </div>
                      </div>
                      <div className="rounded-[1.5rem] border border-white/70 bg-white p-5">
                        <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                          Score
                        </div>
                        <div className="mt-3 text-3xl font-black text-[#155ca5]">
                          {result.scorePercent}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.25em] text-[#155ca5]">
                      Question {currentQuestionIndex + 1} / {questions.length}
                    </div>
                    <h2 className="mt-2 text-2xl font-black text-[#1e2e51]">
                      {selectedItem.title}
                    </h2>
                  </div>
                  <div className="rounded-full bg-[#155ca5]/10 px-4 py-2 text-sm font-bold text-[#155ca5]">
                    Answered {answeredCount}/{questions.length}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {questions.map((question, index) => (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-black transition ${
                        index === currentQuestionIndex
                          ? "border-[#155ca5] bg-[#155ca5] text-white"
                          : getQuestionStatusClasses(question.id, answers, Boolean(result))
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                <div className="space-y-6 rounded-[2rem] border border-slate-200 p-6">
                  <div className="space-y-4">
                    <div className="text-xs font-black uppercase tracking-[0.25em] text-[#155ca5]">
                      {getQuestionTypeLabel(currentQuestion.questionType)}
                    </div>

                    {(currentGroup?.title ||
                      currentGroup?.instruction ||
                      currentGroup?.sharedContent) && (
                      <div className="rounded-[1.5rem] border border-[#dbeafe] bg-[#f8fbff] p-5 text-[#1e2e51]">
                        <div className="mb-2 text-sm font-black uppercase tracking-[0.2em] text-[#155ca5]">
                          Shared Prompt
                        </div>
                        {currentGroup?.title && (
                          <div className="font-bold">{currentGroup.title}</div>
                        )}
                        {currentGroup.instruction && (
                          <div className="mt-3 text-sm text-slate-600">
                            {renderTextWithBreaks(currentGroup.instruction)}
                          </div>
                        )}
                        {currentGroup.sharedContent && (
                          <div className="mt-4 text-base leading-7 text-[#1e2e51]">
                            {renderTextWithBreaks(currentGroup.sharedContent)}
                          </div>
                        )}
                      </div>
                    )}

                    {renderMedia()}

                    {currentQuestion.instruction && (
                      <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        <span className="font-black">Instruction:</span>{" "}
                        {currentQuestion.instruction}
                      </div>
                    )}

                    <div className="text-[2rem] font-black leading-tight text-[#1e2e51]">
                      {formatQuestionLabel(currentQuestion)}
                    </div>
                  </div>

                  {renderAnswerArea()}
                  {renderFeedback()}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentQuestionIndex === 0}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))
                      }
                      disabled={currentQuestionIndex === questions.length - 1}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>

                  {!result ? (
                    <button
                      type="button"
                      onClick={() => void submitAttempt()}
                      disabled={submitting || answeredCount === 0}
                      className="rounded-full bg-[#155ca5] px-6 py-3 text-sm font-black text-white transition hover:bg-[#0f4c88] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? "Submitting..." : "Submit"}
                    </button>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={backToOverview}
                        className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                      >
                        Back to Packages
                      </button>
                      <button
                        type="button"
                        onClick={startAttempt}
                        className="rounded-full bg-[#155ca5] px-6 py-3 text-sm font-black text-white transition hover:bg-[#0f4c88]"
                      >
                        Retry This Package
                      </button>
                    </div>
                  )}
                </div>

                {getResultMeta?.(selectedItem) && (
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    {getResultMeta(selectedItem)}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-[1.75rem] border border-dashed border-slate-200 p-10 text-center text-slate-500">
                {emptyQuestionsText}
              </div>
            )
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-slate-200 p-10 text-center text-slate-500">
              {emptyListText}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
