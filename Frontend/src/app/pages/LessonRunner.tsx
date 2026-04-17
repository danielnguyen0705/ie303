import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ChevronLeft,
  CheckCircle2,
  Loader2,
  Mic,
  MicOff,
  RotateCcw,
  Volume2,
  XCircle,
} from "lucide-react";
import {
  completeLesson,
  getLessonById,
  getQuestionsByLesson,
  submitQuestionHistory,
} from "@/api";
import { ENV } from "@/config/env";
import type {
  LessonQuestionResponse,
  QuestionDto,
  QuestionGroupDto,
  QuestionType,
} from "@/api/questions";

type FlatQuestionItem = {
  id: string;
  order: number;
  group: QuestionGroupDto | null;
  question: QuestionDto;
};

type UserAnswer = string | string[] | Record<string, string>;

type AnswerState = Record<
  number,
  {
    answer: UserAnswer;
    submitted: boolean;
    correct: boolean | null;
  }
>;

type LessonRewardState = {
  coinsEarned: number;
  expEarned: number;
  progressPercent: number;
  currentExp: number;
};

function flattenQuestions(data: LessonQuestionResponse): FlatQuestionItem[] {
  const flat: FlatQuestionItem[] = [];
  let order = 0;

  for (const q of data.singleQuestions ?? []) {
    flat.push({
      id: `single-${q.id}`,
      order: order++,
      group: null,
      question: q,
    });
  }

  for (const group of data.questionGroups ?? []) {
    for (const q of group.questions ?? []) {
      flat.push({
        id: `group-${group.id}-${q.id}`,
        order: order++,
        group,
        question: q,
      });
    }
  }

  return flat;
}

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
  return ["WORD_BANK_FILL", "LIMITED_FILL", "WORD_FORM", "VERB_FORM"].includes(
    type,
  );
}

function isManualType(type: QuestionType) {
  return [
    "SENTENCE_REWRITE",
    "ESSAY_WRITING",
    "PRONUNCIATION",
    "TOPIC_SPEAKING",
  ].includes(type);
}

function isAutoGradedType(type: QuestionType) {
  return !isManualType(type);
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
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

function getQuestionImageUrl(group: QuestionGroupDto | null, question: QuestionDto) {
  return resolveMediaUrl(question.imageUrl || group?.imageUrl || null);
}

function getQuestionAudioUrl(group: QuestionGroupDto | null, question: QuestionDto) {
  return resolveMediaUrl(question.audioUrl || group?.audioUrl || null);
}

function MediaBlock({
  imageUrl,
  audioUrl,
}: {
  imageUrl?: string | null;
  audioUrl?: string | null;
}) {
  if (!imageUrl && !audioUrl) return null;

  return (
    <div className="space-y-4">
      {imageUrl && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
          <img
            src={imageUrl}
            alt="question media"
            className="w-full max-h-[360px] object-contain"
          />
        </div>
      )}

      {audioUrl && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#155ca5] mb-3">
            <Volume2 className="w-4 h-4" />
            Audio
          </div>
          <audio controls className="w-full">
            <source src={audioUrl} />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </div>
  );
}

function GroupSharedContent({
  group,
}: {
  group: QuestionGroupDto | null;
}) {
  if (!group) return null;

  const hasContent =
    group.title ||
    group.instruction ||
    group.sharedContent ||
    group.imageUrl ||
    group.audioUrl;

  if (!hasContent) return null;

  return (
    <div className="bg-[#f8fbff] border border-[#dbeafe] rounded-3xl p-6 md:p-8 space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          {group.title && (
            <h3 className="text-xl md:text-2xl font-black text-[#1e2e51]">
              {group.title}
            </h3>
          )}

          {group.instruction && (
            <p className="text-sm md:text-base font-medium text-[#155ca5]">
              {group.instruction}
            </p>
          )}
        </div>

        {group.groupType && (
          <span className="inline-flex items-center rounded-full bg-white border border-[#cfe3ff] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#155ca5]">
            {group.groupType.replaceAll("_", " ")}
          </span>
        )}
      </div>

      {group.sharedContent && (
        <div className="text-gray-700 leading-7 whitespace-pre-wrap rounded-2xl bg-white/70 border border-[#e5eefc] p-5">
          {group.sharedContent}
        </div>
      )}

      <MediaBlock imageUrl={group.imageUrl} audioUrl={group.audioUrl} />
    </div>
  );
}

function LessonRunner() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const lessonIdNumber = useMemo(() => Number(lessonId), [lessonId]);

  const [data, setData] = useState<LessonQuestionResponse | null>(null);
  const [questions, setQuestions] = useState<FlatQuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [finished, setFinished] = useState(false);
  const [submittingCurrent, setSubmittingCurrent] = useState(false);
  const [submitApiError, setSubmitApiError] = useState<string | null>(null);
  const [completingLesson, setCompletingLesson] = useState(false);
  const [completeApiError, setCompleteApiError] = useState<string | null>(null);
  const [lessonReward, setLessonReward] = useState<LessonRewardState | null>(null);
  const [sectionId, setSectionId] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [speechPreview, setSpeechPreview] = useState("");
  const [speechSessionQuestionId, setSpeechSessionQuestionId] = useState<
    number | null
  >(null);
  const speechRecognitionRef = useRef<{
    stop: () => void;
    start: () => void;
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((event: any) => void) | null;
    onerror: ((event: { error?: string }) => void) | null;
    onend: (() => void) | null;
  } | null>(null);

  useEffect(() => {
    const loadQuestions = async () => {
      if (!lessonIdNumber || Number.isNaN(lessonIdNumber)) {
        setError("Lesson ID không hợp lệ");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await getQuestionsByLesson(lessonIdNumber);

        if (res.success && res.data) {
          setData(res.data);
          setQuestions(flattenQuestions(res.data));
        } else {
          setError(res.error?.message || "Không tải được câu hỏi");
        }
      } catch (err) {
        console.error("Error loading questions:", err);
        setError("Có lỗi xảy ra khi tải câu hỏi");
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [lessonIdNumber]);

  useEffect(() => {
    const loadLessonMeta = async () => {
      if (!lessonIdNumber || Number.isNaN(lessonIdNumber)) return;

      const res = await getLessonById(lessonIdNumber);
      if (res.success && res.data?.sectionId) {
        setSectionId(res.data.sectionId);
      }
    };

    void loadLessonMeta();
  }, [lessonIdNumber]);

  const currentItem = questions[currentIndex];
  const currentQuestion = currentItem?.question;
  const currentGroup = currentItem?.group;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  const groupData = useMemo(() => {
    if (!currentGroup?.groupData) return null;
    return parseJsonSafe<Record<string, any>>(currentGroup.groupData);
  }, [currentGroup]);

  const questionData = useMemo(() => {
    if (!currentQuestion?.questionData) return null;
    return parseJsonSafe<Record<string, any>>(currentQuestion.questionData);
  }, [currentQuestion]);

  const totalCorrect = useMemo(() => {
    return Object.values(answers).filter((a) => a.correct === true).length;
  }, [answers]);

  const questionTypeById = useMemo(() => {
    return new Map(questions.map((item) => [item.question.id, item.question.questionType]));
  }, [questions]);

  const autoGradedSubmitted = useMemo(() => {
    return Object.entries(answers).filter(([questionId, state]) => {
      if (!state.submitted) return false;
      const type = questionTypeById.get(Number(questionId));
      return !!type && isAutoGradedType(type);
    });
  }, [answers, questionTypeById]);

  const autoGradedCorrectCount = useMemo(() => {
    return autoGradedSubmitted.filter(([, state]) => state.correct === true).length;
  }, [autoGradedSubmitted]);

  const autoGradedSubmittedCount = autoGradedSubmitted.length;

  const totalSubmitted = useMemo(() => {
    return Object.values(answers).filter((a) => a.submitted).length;
  }, [answers]);

  const submittedPercent =
    questions.length > 0 ? Math.round((totalSubmitted / questions.length) * 100) : 0;

  const progressPercent =
    questions.length > 0
      ? Math.round(((currentIndex + 1) / questions.length) * 100)
      : 0;

  const wordBank = useMemo(() => {
    const words = groupData?.wordBank;
    return Array.isArray(words) ? words : [];
  }, [groupData]);

  const reorderWords = useMemo(() => {
    if (!currentQuestion || currentQuestion.questionType !== "SENTENCE_REORDER") {
      return [];
    }

    if (currentQuestion.questionData?.includes("/")) {
      return currentQuestion.questionData
        .split("/")
        .map((w) => w.trim())
        .filter(Boolean);
    }

    if (Array.isArray(questionData?.words)) {
      return questionData.words;
    }

    return [];
  }, [currentQuestion, questionData]);

  const matchingData = useMemo(() => {
    if (!currentQuestion || currentQuestion.questionType !== "MATCHING") {
      return null;
    }

    const parsed = parseJsonSafe<{
      left?: string[];
      right?: string[];
      answers?: Record<string, string>;
    }>(currentQuestion.questionData);

    return parsed;
  }, [currentQuestion]);

  const setAnswer = (questionId: number, answer: UserAnswer) => {
    setSubmitApiError(null);
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        answer,
        submitted: false,
        correct: null,
      },
    }));
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
          const [_, value] = item.split("|||");
          return value ?? item;
        })
        .join(" ")
        .trim();
    }

    return JSON.stringify(answer);
  };

  const stopSpeechCapture = () => {
    speechRecognitionRef.current?.stop();
    speechRecognitionRef.current = null;
    setIsListening(false);
    setSpeechPreview("");
    setSpeechSessionQuestionId(null);
  };

  const startSpeechCapture = () => {
    if (!currentQuestion || currentAnswer?.submitted) return;

    const speechWindow = window as Window & {
      SpeechRecognition?: new () => {
        stop: () => void;
        start: () => void;
        lang: string;
        continuous: boolean;
        interimResults: boolean;
        onresult: ((event: any) => void) | null;
        onerror: ((event: { error?: string }) => void) | null;
        onend: (() => void) | null;
      };
      webkitSpeechRecognition?: new () => {
        stop: () => void;
        start: () => void;
        lang: string;
        continuous: boolean;
        interimResults: boolean;
        onresult: ((event: any) => void) | null;
        onerror: ((event: { error?: string }) => void) | null;
        onend: (() => void) | null;
      };
    };

    const SpeechRecognitionCtor =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setSpeechSupported(false);
      setSpeechError("Trình duyệt chưa hỗ trợ nhận diện giọng nói.");
      return;
    }

    setSpeechSupported(true);
    setSpeechError(null);
    stopSpeechCapture();

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0]?.transcript ?? "";

        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      if (interimText.trim()) {
        setSpeechPreview(interimText.trim());
      }

      if (finalText.trim()) {
        const previous =
          typeof answers[currentQuestion.id]?.answer === "string"
            ? answers[currentQuestion.id].answer
            : "";

        const nextText = `${previous} ${finalText}`.replace(/\s+/g, " ").trim();
        setAnswer(currentQuestion.id, nextText);
        setSpeechPreview("");
      }
    };

    recognition.onerror = (event) => {
      setSpeechError(event.error || "Không thể nhận diện giọng nói.");
      setIsListening(false);
      setSpeechSessionQuestionId(null);
    };

    recognition.onend = () => {
      setIsListening(false);
      setSpeechPreview("");
      setSpeechSessionQuestionId(null);
      speechRecognitionRef.current = null;
    };

    recognition.start();
    speechRecognitionRef.current = recognition;
    setIsListening(true);
    setSpeechSessionQuestionId(currentQuestion.id);
  };

  useEffect(() => {
    return () => {
      stopSpeechCapture();
    };
  }, []);

  useEffect(() => {
    if (!currentQuestion) return;

    if (isListening && speechSessionQuestionId !== currentQuestion.id) {
      stopSpeechCapture();
    }
  }, [currentQuestion, isListening, speechSessionQuestionId]);

  const updateMatchingAnswer = (leftItem: string, selectedRight: string) => {
    if (!currentQuestion) return;

    const current = answers[currentQuestion.id]?.answer;
    const next =
      current && typeof current === "object" && !Array.isArray(current)
        ? { ...current, [leftItem]: selectedRight }
        : { [leftItem]: selectedRight };

    setAnswer(currentQuestion.id, next);
  };

  const removeMatchingAnswer = (leftItem: string) => {
    if (!currentQuestion) return;

    const current = answers[currentQuestion.id]?.answer;
    if (!current || typeof current !== "object" || Array.isArray(current)) return;

    const next = { ...current };
    delete next[leftItem];
    setAnswer(currentQuestion.id, next);
  };

  const appendWordBankWord = (word: string) => {
    if (!currentQuestion) return;
    const current = answers[currentQuestion.id]?.answer;
    const text = typeof current === "string" ? current : "";
    const next = text.trim() ? `${text} ${word}` : word;
    setAnswer(currentQuestion.id, next);
  };

  const appendReorderWord = (word: string, index: number) => {
    if (!currentQuestion) return;

    const current = answers[currentQuestion.id]?.answer;
    const selected = Array.isArray(current) ? current : [];
    const token = `${index}|||${word}`;

    if (selected.includes(token)) return;

    setAnswer(currentQuestion.id, [...selected, token]);
  };

  const removeLastReorderWord = () => {
    if (!currentQuestion) return;

    const current = answers[currentQuestion.id]?.answer;
    const selected = Array.isArray(current) ? current : [];
    setAnswer(currentQuestion.id, selected.slice(0, -1));
  };

  const resetReorderAnswer = () => {
    if (!currentQuestion) return;
    setAnswer(currentQuestion.id, []);
  };

  const getDisplayedReorderSentence = () => {
    if (!currentQuestion) return "";
    const current = answers[currentQuestion.id]?.answer;
    const selected = Array.isArray(current) ? current : [];
    return selected
      .map((item) => item.split("|||")[1] ?? "")
      .join(" ")
      .trim();
  };

  const canSubmitCurrent = useMemo(() => {
    if (!currentQuestion || !currentAnswer) return false;

    const answer = currentAnswer.answer;

    if (typeof answer === "string") {
      return answer.trim().length > 0;
    }

    if (Array.isArray(answer)) {
      return answer.length > 0;
    }

    if (typeof answer === "object" && answer !== null) {
      if (currentQuestion.questionType === "MATCHING") {
        const answerMap = !Array.isArray(answer) ? answer : {};
        const leftItems = matchingData?.left ?? [];

        if (leftItems.length === 0) {
          return Object.keys(answerMap).length > 0;
        }

        return leftItems.every(
          (leftItem) =>
            typeof answerMap[leftItem] === "string" &&
            String(answerMap[leftItem]).trim().length > 0,
        );
      }

      return Object.keys(answer).length > 0;
    }

    return false;
  }, [currentAnswer, currentQuestion, matchingData]);

  const submitCurrent = async () => {
    if (!currentQuestion) return;

    const saved = answers[currentQuestion.id];
    if (!saved) return;

    setSubmittingCurrent(true);
    setSubmitApiError(null);

    try {
      let correct: boolean | null = false;

      if (isMCQ(currentQuestion.questionType)) {
        const selected = normalizeText(String(saved.answer));
        const correctOption = currentQuestion.options.find((o) => o.isCorrect);
        correct = correctOption
          ? normalizeText(correctOption.optionKey) === selected ||
            normalizeText(correctOption.content) === selected
          : false;
      } else if (currentQuestion.questionType === "TRUE_FALSE_NG") {
        const selected = normalizeText(String(saved.answer));
        const expected = normalizeText(String(currentQuestion.correctAnswer ?? ""));
        correct = selected === expected;
      } else if (isFillType(currentQuestion.questionType)) {
        const typed = normalizeText(String(saved.answer));
        const expected = normalizeText(String(currentQuestion.correctAnswer ?? ""));
        correct = typed === expected;
      } else if (currentQuestion.questionType === "SENTENCE_REORDER") {
        const builtSentence = getDisplayedReorderSentence();
        const expected = normalizeText(String(currentQuestion.correctAnswer ?? ""));
        correct = normalizeText(builtSentence) === expected;
      } else if (currentQuestion.questionType === "MATCHING") {
        const answerMap =
          saved.answer &&
          typeof saved.answer === "object" &&
          !Array.isArray(saved.answer)
            ? saved.answer
            : {};

        const expectedMap =
          parseJsonSafe<Record<string, string>>(currentQuestion.correctAnswer || "") ||
          matchingData?.answers ||
          null;

        if (!expectedMap) {
          correct = null;
        } else {
          const leftItems = Object.keys(expectedMap);
          correct = leftItems.every(
            (left) =>
              normalizeText(answerMap[left] || "") ===
              normalizeText(expectedMap[left] || ""),
          );
        }
      } else if (isManualType(currentQuestion.questionType)) {
        correct = null;
      }

      const answerText = toAnswerText(saved.answer, currentQuestion);

      const res = await submitQuestionHistory({
        questionId: currentQuestion.id,
        answer_text: answerText,
      });

      if (res.success && res.data) {
        correct = res.data.correct;
      } else if (!res.success) {
        setSubmitApiError(
          res.error?.message || "Không gửi được câu trả lời lên hệ thống.",
        );
      }

      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          ...prev[currentQuestion.id],
          submitted: true,
          correct,
        },
      }));
    } finally {
      setSubmittingCurrent(false);
    }
  };

  const goNext = async () => {
    if (currentIndex >= questions.length - 1) {
      if (!lessonIdNumber || Number.isNaN(lessonIdNumber)) {
        setCompleteApiError("Không thể lưu lesson vì lessonId không hợp lệ.");
        setFinished(true);
        return;
      }

      const accuracyRaw =
        autoGradedSubmittedCount > 0
          ? (autoGradedCorrectCount / autoGradedSubmittedCount) * 100
          : 0;
      const accuracy = Number(accuracyRaw.toFixed(1));
      const score = Number((accuracy / 10).toFixed(1));

      setCompletingLesson(true);
      setCompleteApiError(null);

      try {
        const res = await completeLesson({
          lessonId: lessonIdNumber,
          score,
          accuracy,
        });

        if (res.success && res.data) {
          setLessonReward({
            coinsEarned: res.data.coinsEarned,
            expEarned: res.data.expEarned,
            progressPercent: res.data.progressPercent,
            currentExp: res.data.currentExp,
          });
        } else if (!res.success) {
          setCompleteApiError(
            res.error?.message || "Không lưu được trạng thái hoàn thành lesson.",
          );
        }
      } finally {
        setCompletingLesson(false);
      }

      setFinished(true);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
  };

  const renderQuestionHint = () => {
    if (!currentQuestion?.questionData) return null;

    if (
      currentQuestion.questionType === "MATCHING" ||
      currentQuestion.questionType === "SENTENCE_REORDER"
    ) {
      return null;
    }

    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <span className="font-bold">Question data:</span> {currentQuestion.questionData}
      </div>
    );
  };

  const renderAnswerArea = () => {
    if (!currentQuestion) return null;

    if (isMCQ(currentQuestion.questionType)) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQuestion.options.map((option) => {
            const selected = currentAnswer?.answer === option.optionKey;
            const submitted = currentAnswer?.submitted;
            const isCorrectOption = option.isCorrect;

            let extraClass =
              "border-gray-200 bg-white hover:border-[#155ca5]/40 hover:bg-[#f8fbff]";

            if (submitted) {
              if (isCorrectOption) {
                extraClass = "border-green-400 bg-green-50";
              } else if (selected) {
                extraClass = "border-red-400 bg-red-50";
              }
            } else if (selected) {
              extraClass = "border-[#155ca5] bg-[#f3f7ff]";
            }

            return (
              <button
                key={`${option.id}-${option.optionKey}-${option.content}`}
                disabled={submitted}
                onClick={() => setAnswer(currentQuestion.id, option.optionKey)}
                className={`text-left rounded-2xl border-2 p-5 transition-all ${extraClass}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-white border flex items-center justify-center font-black text-[#1e2e51]">
                    {option.optionKey}
                  </div>
                  <div className="font-semibold text-[#1e2e51]">
                    {option.content}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    if (currentQuestion.questionType === "TRUE_FALSE_NG") {
      const values = ["true", "false", "not given"];

      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {values.map((value) => {
            const selected = currentAnswer?.answer === value;
            const submitted = currentAnswer?.submitted;

            let extraClass =
              "border-gray-200 bg-white hover:border-[#155ca5]/40 hover:bg-[#f8fbff]";

            if (submitted) {
              const expected = normalizeText(String(currentQuestion.correctAnswer ?? ""));
              if (normalizeText(value) === expected) {
                extraClass = "border-green-400 bg-green-50";
              } else if (selected) {
                extraClass = "border-red-400 bg-red-50";
              }
            } else if (selected) {
              extraClass = "border-[#155ca5] bg-[#f3f7ff]";
            }

            return (
              <button
                key={value}
                disabled={submitted}
                onClick={() => setAnswer(currentQuestion.id, value)}
                className={`rounded-2xl border-2 p-5 font-bold uppercase transition-all ${extraClass}`}
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
        <div className="space-y-3">
          <input
            type="text"
            disabled={currentAnswer?.submitted}
            value={typeof currentAnswer?.answer === "string" ? currentAnswer.answer : ""}
            onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
            placeholder="Nhập câu trả lời..."
            className="w-full rounded-2xl border border-gray-300 px-5 py-4 outline-none focus:border-[#155ca5]"
          />
        </div>
      );
    }

    if (currentQuestion.questionType === "WORD_BANK_FILL") {
      return (
        <div className="space-y-4">
          {wordBank.length > 0 && (
            <div className="rounded-2xl border border-[#dbeafe] bg-[#f8fbff] p-4">
              <p className="text-sm font-bold text-[#155ca5] mb-3">Word Bank</p>
              <div className="flex flex-wrap gap-2">
                {wordBank.map((word: string) => (
                  <button
                    key={word}
                    type="button"
                    disabled={currentAnswer?.submitted}
                    onClick={() => appendWordBankWord(word)}
                    className="px-4 py-2 rounded-full border border-[#bfd8ff] bg-white text-[#155ca5] font-semibold hover:bg-[#eef6ff] disabled:opacity-60"
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>
          )}

          <input
            type="text"
            disabled={currentAnswer?.submitted}
            value={typeof currentAnswer?.answer === "string" ? currentAnswer.answer : ""}
            onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
            placeholder="Điền từ hoặc bấm từ trong Word Bank..."
            className="w-full rounded-2xl border border-gray-300 px-5 py-4 outline-none focus:border-[#155ca5]"
          />
        </div>
      );
    }

    if (currentQuestion.questionType === "SENTENCE_REORDER") {
      const selectedTokens = Array.isArray(currentAnswer?.answer)
        ? currentAnswer.answer
        : [];

      return (
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#dbeafe] bg-[#f8fbff] p-5">
            <p className="text-sm font-bold text-[#155ca5] mb-3">Your sentence</p>
            <div className="min-h-[60px] rounded-2xl border border-dashed border-[#9bc2ff] bg-white p-4 text-lg font-semibold text-[#1e2e51]">
              {getDisplayedReorderSentence() || "Chưa chọn từ nào"}
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                type="button"
                disabled={currentAnswer?.submitted || selectedTokens.length === 0}
                onClick={removeLastReorderWord}
                className="px-4 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                Undo
              </button>
              <button
                type="button"
                disabled={currentAnswer?.submitted || selectedTokens.length === 0}
                onClick={resetReorderAnswer}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-gray-600 mb-3">Available words</p>
            <div className="flex flex-wrap gap-3">
              {reorderWords.map((word, index) => {
                const token = `${index}|||${word}`;
                const selected = selectedTokens.includes(token);

                return (
                  <button
                    key={token}
                    type="button"
                    disabled={currentAnswer?.submitted || selected}
                    onClick={() => appendReorderWord(word, index)}
                    className={`px-4 py-2 rounded-xl border font-semibold transition-all ${
                      selected
                        ? "border-gray-300 bg-gray-100 text-gray-400"
                        : "border-[#bfd8ff] bg-white text-[#155ca5] hover:bg-[#eef6ff]"
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

      const usedRightValues = new Set(
        Object.values(answerMap)
          .map((value) => String(value || "").trim())
          .filter(Boolean),
      );

      const availableRightItems = rightItems.filter(
        (rightItem) => !usedRightValues.has(String(rightItem).trim()),
      );

      return (
        <div className="space-y-4">
          {leftItems.length > 0 && rightItems.length > 0 ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-[#dbeafe] bg-[#f8fbff] p-4">
                <p className="text-sm font-bold text-[#155ca5] mb-3">
                  Kéo thẻ nghĩa bên dưới vào từng từ bên trái
                </p>

                {availableRightItems.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableRightItems.map((rightItem) => (
                      <button
                        key={`matching-card-${rightItem}`}
                        type="button"
                        draggable={!currentAnswer?.submitted}
                        disabled={currentAnswer?.submitted}
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", rightItem);
                          event.dataTransfer.effectAllowed = "move";
                        }}
                        className="px-4 py-2 rounded-xl border border-[#bfd8ff] bg-white text-[#155ca5] font-semibold hover:bg-[#eef6ff] disabled:opacity-60"
                      >
                        {rightItem}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Tất cả thẻ đã được ghép.</p>
                )}
              </div>

              <div className="space-y-3">
                {leftItems.map((leftItem) => {
                  const selectedValue = answerMap[leftItem] || "";

                  return (
                    <div
                      key={leftItem}
                      className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-3 items-center rounded-2xl border border-gray-200 p-4"
                    >
                      <div className="font-semibold text-[#1e2e51]">{leftItem}</div>

                      <div
                        onDragOver={(event) => {
                          if (currentAnswer?.submitted) return;
                          event.preventDefault();
                          event.dataTransfer.dropEffect = "move";
                        }}
                        onDrop={(event) => {
                          if (currentAnswer?.submitted) return;
                          event.preventDefault();
                          const dropped = event.dataTransfer.getData("text/plain");
                          if (!dropped) return;
                          if (!rightItems.includes(dropped)) return;
                          updateMatchingAnswer(leftItem, dropped);
                        }}
                        className={`min-h-[56px] rounded-xl border-2 border-dashed px-3 py-2 flex items-center justify-between gap-2 ${
                          selectedValue
                            ? "border-[#bfd8ff] bg-[#f8fbff]"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {selectedValue ? (
                          <span className="text-[#155ca5] font-semibold">{selectedValue}</span>
                        ) : (
                          <span className="text-gray-400 text-sm">Thả thẻ vào đây</span>
                        )}

                        {selectedValue && !currentAnswer?.submitted && (
                          <button
                            type="button"
                            onClick={() => removeMatchingAnswer(leftItem)}
                            className="text-xs px-2 py-1 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50"
                          >
                            Bỏ
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6">
              <p className="font-bold text-[#1e2e51]">
                Matching data chưa đúng format.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Cần questionData dạng:
                {" "}
                {"{\"left\":[...],\"right\":[...]}"}
              </p>
            </div>
          )}
        </div>
      );
    }

    if (currentQuestion.questionType === "SENTENCE_REWRITE") {
      return (
        <textarea
          rows={4}
          disabled={currentAnswer?.submitted}
          value={typeof currentAnswer?.answer === "string" ? currentAnswer.answer : ""}
          onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
          placeholder="Viết lại câu ở đây..."
          className="w-full rounded-2xl border border-gray-300 px-5 py-4 outline-none focus:border-[#155ca5] resize-none"
        />
      );
    }

    if (currentQuestion.questionType === "ESSAY_WRITING") {
      return (
        <textarea
          rows={8}
          disabled={currentAnswer?.submitted}
          value={typeof currentAnswer?.answer === "string" ? currentAnswer.answer : ""}
          onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
          placeholder="Write your essay here..."
          className="w-full rounded-2xl border border-gray-300 px-5 py-4 outline-none focus:border-[#155ca5] resize-y"
        />
      );
    }

    if (
      currentQuestion.questionType === "PRONUNCIATION" ||
      currentQuestion.questionType === "TOPIC_SPEAKING"
    ) {
      const speakingActive =
        isListening && speechSessionQuestionId === currentQuestion.id;

      return (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 space-y-4">
          <p className="font-bold text-[#1e2e51]">
            Dạng {getQuestionTypeLabel(currentQuestion.questionType)}
          </p>
          <p className="text-sm text-gray-600">
            Nhấn "Bắt đầu nói" để hệ thống nghe và tự hiện chữ vào ô transcript.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {!speakingActive ? (
              <button
                type="button"
                disabled={currentAnswer?.submitted || !speechSupported}
                onClick={startSpeechCapture}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#bfd8ff] bg-white text-[#155ca5] font-semibold hover:bg-[#eef6ff] disabled:opacity-50"
              >
                <Mic className="w-4 h-4" />
                Bắt đầu nói
              </button>
            ) : (
              <button
                type="button"
                disabled={currentAnswer?.submitted}
                onClick={stopSpeechCapture}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 font-semibold hover:bg-red-100 disabled:opacity-50"
              >
                <MicOff className="w-4 h-4" />
                Dừng nghe
              </button>
            )}

            {speakingActive && (
              <span className="text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 border border-red-200 rounded-full px-3 py-1">
                Đang nghe... nói để hiện chữ
              </span>
            )}
          </div>

          {speechPreview && (
            <p className="text-sm text-[#155ca5]">
              Đang nghe: <span className="font-semibold">{speechPreview}</span>
            </p>
          )}

          {speechError && (
            <p className="text-sm text-red-600">Lỗi voice: {speechError}</p>
          )}

          <textarea
            rows={4}
            disabled={currentAnswer?.submitted}
            value={typeof currentAnswer?.answer === "string" ? currentAnswer.answer : ""}
            onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
            placeholder="Transcript se hien tai day khi ban noi..."
            className="w-full rounded-2xl border border-gray-300 px-5 py-4 outline-none focus:border-[#155ca5] resize-none bg-white"
          />
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6">
        <p className="font-bold text-[#1e2e51]">
          Chưa hỗ trợ UI cho dạng {getQuestionTypeLabel(currentQuestion.questionType)}
        </p>
      </div>
    );
  };

  const renderFeedback = () => {
    if (!currentQuestion || !currentAnswer?.submitted) return null;

    const isUngraded = currentAnswer.correct === null;

    return (
      <div
        className={`rounded-2xl p-5 border ${
          isUngraded
            ? "bg-amber-50 border-amber-200"
            : currentAnswer.correct
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
        }`}
      >
        <div className="flex items-start gap-3">
          {isUngraded ? (
            <div className="w-6 h-6 rounded-full bg-amber-400 mt-0.5" />
          ) : currentAnswer.correct ? (
            <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5" />
          ) : (
            <XCircle className="w-6 h-6 text-red-600 mt-0.5" />
          )}

          <div className="space-y-2">
            <p
              className={`font-black ${
                isUngraded
                  ? "text-amber-800"
                  : currentAnswer.correct
                    ? "text-green-700"
                    : "text-red-700"
              }`}
            >
              {isUngraded
                ? "Đã lưu câu trả lời"
                : currentAnswer.correct
                  ? "Chính xác!"
                  : "Chưa đúng"}
            </p>

            {currentQuestion.explanation && (
              <p className="text-gray-700">{currentQuestion.explanation}</p>
            )}

            {!isUngraded &&
              !currentAnswer.correct &&
              currentQuestion.correctAnswer && (
                <p className="text-sm font-semibold text-gray-600">
                  Đáp án đúng: {currentQuestion.correctAnswer}
                </p>
              )}

            {currentQuestion.questionType === "MATCHING" &&
              currentAnswer.correct === null && (
                <p className="text-sm text-gray-600">
                  Matching chỉ tự chấm khi backend trả về `correctAnswer` hoặc mapping đáp án đầy đủ.
                </p>
              )}

            {isManualType(currentQuestion.questionType) && (
              <p className="text-sm text-gray-600">
                Dạng này hiện đang lưu câu trả lời, chưa chấm tự động.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-10 min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-[#155ca5]" />
          <p className="text-gray-600 font-medium">Đang tải câu hỏi...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-bold">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 mt-4 px-5 py-2 rounded-full bg-white border border-red-200 text-red-600 font-semibold hover:bg-red-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Quay lại
          </Link>
        </div>
      </main>
    );
  }

  if (!data || questions.length === 0) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
          <p className="text-lg font-bold text-[#1e2e51]">
            Lesson này chưa có câu hỏi nào
          </p>
        </div>
      </main>
    );
  }

  if (finished) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="bg-white rounded-3xl shadow-sm p-10 text-center space-y-6">
          <div className="w-24 h-24 mx-auto rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>

          <div>
            <h1 className="text-4xl font-black text-[#1e2e51]">
              Hoàn thành lesson
            </h1>
            <p className="text-gray-600 mt-3 text-lg">
              Auto-grade: đúng {autoGradedCorrectCount}/{autoGradedSubmittedCount || 0} câu.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Đã nộp: {totalSubmitted}/{questions.length} câu
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Điều kiện qua bài: accuracy từ 80% trở lên.
            </p>

            {lessonReward && (
              <p className="text-sm text-[#1e2e51] mt-2 font-semibold">
                Thưởng: +{lessonReward.coinsEarned} coins, +{lessonReward.expEarned} EXP
              </p>
            )}

            {lessonReward && (
              <p className="text-sm text-gray-600 mt-1">
                Tiến độ lesson (BE2): {lessonReward.progressPercent}% | Tổng EXP: {lessonReward.currentExp}
              </p>
            )}

            {completeApiError && (
              <p className="text-sm text-red-600 mt-2">{completeApiError}</p>
            )}
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => {
                stopSpeechCapture();
                setFinished(false);
                setCurrentIndex(0);
                setAnswers({});
                setSubmitApiError(null);
                setCompleteApiError(null);
                setLessonReward(null);
              }}
              className="px-6 py-3 rounded-xl bg-[#155ca5] text-white font-bold hover:bg-[#0f4c88]"
            >
              Làm lại
            </button>

            {sectionId ? (
              <Link
                to={`/sections/${sectionId}/lessons`}
                className="px-6 py-3 rounded-xl border border-gray-300 font-bold text-[#1e2e51] hover:bg-gray-50"
              >
                Về danh sách lesson
              </Link>
            ) : (
              <Link
                to="/"
                className="px-6 py-3 rounded-xl border border-gray-300 font-bold text-[#1e2e51] hover:bg-gray-50"
              >
                Về dashboard
              </Link>
            )}

            {sectionId && (
              <button
                onClick={() => navigate(`/sections/${sectionId}/lessons`)}
                className="px-6 py-3 rounded-xl bg-[#27ae60] text-white font-bold hover:bg-[#1f8b4d]"
              >
                End lesson
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  if (!currentQuestion) return null;

  const mediaImageUrl = getQuestionImageUrl(currentGroup, currentQuestion);
  const mediaAudioUrl = getQuestionAudioUrl(currentGroup, currentQuestion);

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 pb-28">
      <section className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[#155ca5] font-bold hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          Quay lại
        </Link>

        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <span className="inline-block px-3 py-1 rounded-full bg-[#73aaf9]/20 text-[#155ca5] text-xs font-bold uppercase tracking-wider">
              Lesson {lessonId}
            </span>
            <span className="text-sm font-bold text-gray-500">
              Câu {currentIndex + 1}/{questions.length}
            </span>
          </div>

          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#155ca5] rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <GroupSharedContent group={currentGroup} />

        <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="inline-block px-3 py-1 rounded-full bg-[#f3f7ff] text-[#155ca5] text-xs font-bold uppercase tracking-wider">
                {getQuestionTypeLabel(currentQuestion.questionType)}
              </div>

              {currentGroup?.title && (
                <div className="text-xs font-semibold text-gray-500">
                  Group: {currentGroup.title}
                </div>
              )}
            </div>

            {currentQuestion.instruction && (
              <p className="text-sm font-medium text-gray-500">
                {currentQuestion.instruction}
              </p>
            )}

            <h2 className="text-2xl md:text-3xl font-black text-[#1e2e51] leading-tight">
              {currentQuestion.content}
            </h2>
          </div>

          <MediaBlock imageUrl={mediaImageUrl} audioUrl={mediaAudioUrl} />

          {renderQuestionHint()}

          {renderAnswerArea()}

          {renderFeedback()}
        </div>
      </section>

      <footer className="mt-8 flex items-center justify-between gap-4 flex-wrap">
        <div className="text-sm text-gray-500 font-medium">
          Đúng {totalCorrect}/{questions.length} câu | Hoàn thành {submittedPercent}%
        </div>

        <div className="flex items-center gap-3">
          {!currentAnswer?.submitted ? (
            <button
              onClick={submitCurrent}
              disabled={!canSubmitCurrent || submittingCurrent}
              className="px-6 py-3 rounded-xl bg-[#155ca5] text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0f4c88]"
            >
              {submittingCurrent ? "Đang nộp..." : "Nộp câu trả lời"}
            </button>
          ) : (
            <button
              onClick={goNext}
              disabled={currentIndex === questions.length - 1 && completingLesson}
              className="px-6 py-3 rounded-xl bg-[#27ae60] text-white font-bold hover:bg-[#1f8b4d] disabled:opacity-60"
            >
              {currentIndex === questions.length - 1
                ? completingLesson
                  ? "Đang lưu kết quả..."
                  : "Kết thúc"
                : "Câu tiếp"}
            </button>
          )}
        </div>

        {submitApiError && (
          <p className="w-full text-sm text-red-600">{submitApiError}</p>
        )}
      </footer>
    </main>
  );
}

export default LessonRunner;