import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ChevronLeft,
  CheckCircle2,
  Loader2,
  Mic,
  MicOff,
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  Volume2,
  XCircle,
} from "lucide-react";
import {
  completeLesson,
  getLessonById,
  getLessonsBySectionProgress,
  getQuestionsByLesson,
  submitEssay,
  submitQuestionHistory,
} from "@/api";
import { ENV } from "@/config/env";
import type {
  LessonQuestionResponse,
  QuestionDto,
  QuestionGroupDto,
  QuestionType,
} from "@/api/questions";

type RunnerItem = {
  id: string;
  order: number;
  group: QuestionGroupDto | null;
  questions: QuestionDto[];
};

type UserAnswer = string | string[] | Record<string, string>;

type AnswerState = Record<
  number,
  {
    answer: UserAnswer;
    submitted: boolean;
    correct: boolean | null;
    feedback?: string | null;
    score?: number | null;
  }
>;

type LessonRewardState = {
  coinsEarned: number;
  expEarned: number;
  progressPercent: number;
  currentExp: number;
};

type SectionLessonProgressItem = {
  lessonId: number;
  lessonTitle: string;
  lessonNumber: number;
  completed: boolean;
  unlocked: boolean;
  current: boolean;
};

function buildRunnerItems(data: LessonQuestionResponse): RunnerItem[] {
  const flat: RunnerItem[] = [];
  let order = 0;

  for (const q of data.singleQuestions ?? []) {
    flat.push({
      id: `single-${q.id}`,
      order: order++,
      group: null,
      questions: [q],
    });
  }

  for (const group of data.questionGroups ?? []) {
    flat.push({
      id: `group-${group.id}`,
      order: order++,
      group,
      questions: group.questions ?? [],
    });
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
  return ["SENTENCE_REWRITE", "ESSAY_WRITING"].includes(type);
}

function isAutoGradedType(type: QuestionType) {
  return !isManualType(type);
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

function normalizeMatchingPayload(value?: string | null) {
  if (!value?.trim()) return null;

  const parsed = parseJsonSafe<Record<string, unknown>>(value);
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    return null;
  }

  const hasStructuredFields =
    Array.isArray(parsed.left) ||
    Array.isArray(parsed.right) ||
    (!!parsed.answers && typeof parsed.answers === "object");

  if (hasStructuredFields) {
    const answers =
      parsed.answers && typeof parsed.answers === "object"
        ? Object.entries(parsed.answers as Record<string, unknown>).reduce<Record<string, string>>(
          (acc, [key, rawValue]) => {
            if (key && rawValue != null) {
              acc[String(key).trim()] = String(rawValue).trim();
            }
            return acc;
          },
          {},
        )
        : {};

    const left = Array.isArray(parsed.left)
      ? parsed.left.map(String).map((item) => item.trim()).filter(Boolean)
      : Object.keys(answers);
    const right = Array.isArray(parsed.right)
      ? parsed.right.map(String).map((item) => item.trim()).filter(Boolean)
      : Array.from(new Set(Object.values(answers)));

    return { left, right, answers };
  }

  const answers = Object.entries(parsed).reduce<Record<string, string>>((acc, [key, rawValue]) => {
    if (key && rawValue != null) {
      acc[String(key).trim()] = String(rawValue).trim();
    }
    return acc;
  }, {});

  if (Object.keys(answers).length === 0) {
    return null;
  }

  return {
    left: Object.keys(answers),
    right: Array.from(new Set(Object.values(answers))),
    answers,
  };
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
        <SmartAudioPlayer audioUrl={audioUrl} />
      )}
    </div>
  );
}

function SmartAudioPlayer({ audioUrl }: { audioUrl: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const applyPlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const togglePlayback = async () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      await audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    audioRef.current.pause();
    setIsPlaying(false);
  };

  const replayLastFiveSeconds = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 5, 0);
    if (audioRef.current.paused) {
      void audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#155ca5]">
        <Volume2 className="w-4 h-4" />
        Audio
      </div>

      <audio
        ref={audioRef}
        controls
        preload="metadata"
        className="w-full"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      >
        <source src={audioUrl} />
        Your browser does not support the audio element.
      </audio>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void togglePlayback()}
            className="inline-flex items-center gap-2 rounded-full border border-[#bfd8ff] bg-[#f8fbff] px-4 py-2 text-sm font-bold text-[#155ca5] hover:bg-[#eef6ff]"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            onClick={replayLastFiveSeconds}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <SkipBack className="h-4 w-4" />
            Replay 5s
          </button>
        </div>

        <div className="flex items-center gap-2">
          {[
            { label: "Slow", value: 0.8 },
            { label: "Normal", value: 1 },
            { label: "Fast", value: 1.2 },
          ].map((rate) => (
            <button
              key={rate.value}
              type="button"
              onClick={() => applyPlaybackRate(rate.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                playbackRate === rate.value
                  ? "bg-[#155ca5] text-white"
                  : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {rate.label}
            </button>
          ))}
        </div>
      </div>
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
    <div className="bg-[#f8fbff] border border-[#dbeafe] rounded-3xl p-6 md:p-7 space-y-5">
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
        <div className="text-base text-gray-700 leading-7 whitespace-pre-wrap rounded-2xl bg-white/70 border border-[#e5eefc] p-5">
          {group.sharedContent}
        </div>
      )}

      <MediaBlock imageUrl={group.imageUrl} audioUrl={group.audioUrl} />
    </div>
  );
}

function isListeningPassageGroup(group: QuestionGroupDto | null) {
  return group?.groupType === "LISTENING_PASSAGE";
}

function isCompactPassageGroup(group: QuestionGroupDto | null) {
  if (!group) return false;

  return (
    group.groupType === "LISTENING_PASSAGE" ||
    group.groupType === "READING_PASSAGE" ||
    Boolean(group.sharedContent?.trim())
  );
}

function LessonRunner() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const lessonIdNumber = useMemo(() => Number(lessonId), [lessonId]);

  const [data, setData] = useState<LessonQuestionResponse | null>(null);
  const [items, setItems] = useState<RunnerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentGroupQuestionIndex, setCurrentGroupQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [finished, setFinished] = useState(false);
  const [submittingCurrent, setSubmittingCurrent] = useState(false);
  const [submitApiError, setSubmitApiError] = useState<string | null>(null);
  const [completingLesson, setCompletingLesson] = useState(false);
  const [completeApiError, setCompleteApiError] = useState<string | null>(null);
  const [lessonReward, setLessonReward] = useState<LessonRewardState | null>(null);
  const [sectionId, setSectionId] = useState<number | null>(null);
  const [sectionLessons, setSectionLessons] = useState<SectionLessonProgressItem[]>([]);
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
    stopSpeechCapture();
    setCurrentIndex(0);
    setCurrentGroupQuestionIndex(0);
    setAnswers({});
    setFinished(false);
    setSubmittingCurrent(false);
    setSubmitApiError(null);
    setCompletingLesson(false);
    setCompleteApiError(null);
    setLessonReward(null);
    setSectionId(null);
    setSectionLessons([]);
    setSpeechPreview("");
    setSpeechSessionQuestionId(null);
    setSpeechError(null);
  }, [lessonIdNumber]);

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
          setItems(buildRunnerItems(res.data));
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

  useEffect(() => {
    const loadSectionLessons = async () => {
      if (!sectionId || Number.isNaN(sectionId)) {
        setSectionLessons([]);
        return;
      }

      const res = await getLessonsBySectionProgress(sectionId);
      if (res.success && res.data) {
        setSectionLessons(
          [...res.data].sort(
            (a, b) => a.lessonNumber - b.lessonNumber || a.lessonId - b.lessonId,
          ),
        );
      }
    };

    void loadSectionLessons();
  }, [sectionId]);

  const currentItem = items[currentIndex];
  const currentGroup = currentItem?.group ?? null;
  const currentQuestions = currentItem?.questions ?? [];
  const isListeningItem = isListeningPassageGroup(currentGroup);
  const isCompactPassageItem = isCompactPassageGroup(currentGroup);
  const activeQuestionIndex =
    currentQuestions.length === 0
      ? 0
      : Math.min(currentGroupQuestionIndex, currentQuestions.length - 1);
  const visibleQuestions =
    isCompactPassageItem
      ? currentQuestions
      : currentGroup && currentQuestions.length > 0
      ? [currentQuestions[activeQuestionIndex]]
      : currentQuestions;
  const totalQuestions = useMemo(
    () => items.reduce((sum, item) => sum + item.questions.length, 0),
    [items],
  );

  const totalCorrect = useMemo(() => {
    return Object.values(answers).filter((a) => a.correct === true).length;
  }, [answers]);

  const questionTypeById = useMemo(() => {
    return new Map(
      items.flatMap((item) =>
        item.questions.map((question) => [question.id, question.questionType] as const),
      ),
    );
  }, [items]);

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
    totalQuestions > 0 ? Math.round((totalSubmitted / totalQuestions) * 100) : 0;

  const progressPercent =
    items.length > 0
      ? Math.round(((currentIndex + 1) / items.length) * 100)
      : 0;

  const nextLesson = useMemo(() => {
    if (!sectionLessons.length || !lessonIdNumber || Number.isNaN(lessonIdNumber)) {
      return null;
    }

    const currentLessonIndex = sectionLessons.findIndex(
      (lesson) => lesson.lessonId === lessonIdNumber,
    );

    if (currentLessonIndex < 0 || currentLessonIndex >= sectionLessons.length - 1) {
      return null;
    }

    return sectionLessons[currentLessonIndex + 1] ?? null;
  }, [lessonIdNumber, sectionLessons]);

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

  const getQuestionAnswer = (questionId: number) => answers[questionId];

  const getGroupData = (group: QuestionGroupDto | null) => {
    if (!group?.groupData) return null;
    return parseJsonSafe<Record<string, any>>(group.groupData);
  };

  const getQuestionData = (question: QuestionDto) => {
    if (!question.questionData) return null;
    return parseJsonSafe<Record<string, any>>(question.questionData);
  };

  const getWordBank = (group: QuestionGroupDto | null) => {
    const words = getGroupData(group)?.wordBank;
    return Array.isArray(words) ? words : [];
  };

  const getReorderWords = (question: QuestionDto) => {
    if (question.questionType !== "SENTENCE_REORDER") {
      return [];
    }

    if (question.questionData?.includes("/")) {
      return question.questionData
        .split("/")
        .map((w) => w.trim())
        .filter(Boolean);
    }

    const questionData = getQuestionData(question);
    if (Array.isArray(questionData?.words)) {
      return questionData.words;
    }

    return [];
  };

  const getMatchingData = (question: QuestionDto) => {
    if (question.questionType !== "MATCHING") {
      return null;
    }

    const parsedQuestionData = normalizeMatchingPayload(question.questionData);

    if (parsedQuestionData) {
      return parsedQuestionData;
    }

    const parsedCorrectAnswer = normalizeMatchingPayload(question.correctAnswer);
    if (parsedCorrectAnswer) {
      return parsedCorrectAnswer;
    }

    return normalizeMatchingPayload(currentGroup?.groupData);
  };

  const getQuestionHint = (question: QuestionDto, group: QuestionGroupDto | null) => {
    if (question.instruction?.trim()) {
      return question.instruction.trim();
    }

    if (group?.instruction?.trim()) {
      return group.instruction.trim();
    }

    switch (question.questionType) {
      case "MATCHING":
        return "Nối từng mục bên trái với đúng đáp án bên phải. Mỗi đáp án chỉ nên dùng một lần.";
      case "TRUE_FALSE_NG":
        return "Dựa vào đoạn chung để chọn TRUE, FALSE hoặc NOT GIVEN. Không đoán ngoài dữ kiện có trong bài.";
      case "WORD_BANK_FILL":
        return "Đọc toàn câu trước, sau đó chọn từ phù hợp nhất từ word bank để điền vào chỗ trống.";
      case "SENTENCE_REORDER":
        return "Ghép các từ theo thứ tự tạo thành câu hoàn chỉnh và đúng ngữ pháp.";
      case "SENTENCE_REWRITE":
        return "Viết lại câu nhưng giữ nguyên nghĩa chính của câu gốc.";
      case "ESSAY_WRITING":
        return "Trả lời đủ ý, rõ ràng, ưu tiên câu đơn giản nhưng đúng.";
      case "PRONUNCIATION":
      case "TOPIC_SPEAKING":
        return "Bạn có thể bấm ghi âm để lấy transcript rồi chỉnh sửa lại trước khi nộp.";
      default:
        return "Đọc kỹ yêu cầu và chọn đáp án đúng nhất trước khi nộp.";
    }
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

  const startSpeechCapture = (question: QuestionDto) => {
    if (getQuestionAnswer(question.id)?.submitted) return;

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
          typeof answers[question.id]?.answer === "string"
            ? answers[question.id].answer
            : "";

        const nextText = `${previous} ${finalText}`.replace(/\s+/g, " ").trim();
        setAnswer(question.id, nextText);
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
    setSpeechSessionQuestionId(question.id);
  };

  useEffect(() => {
    return () => {
      stopSpeechCapture();
    };
  }, []);

  useEffect(() => {
    const visibleQuestionIds = new Set(currentQuestions.map((question) => question.id));
    if (isListening && speechSessionQuestionId && !visibleQuestionIds.has(speechSessionQuestionId)) {
      stopSpeechCapture();
    }
  }, [currentQuestions, isListening, speechSessionQuestionId]);

  useEffect(() => {
    setCurrentGroupQuestionIndex(0);
  }, [currentIndex]);

  const updateMatchingAnswer = (
    questionId: number,
    leftItem: string,
    selectedRight: string,
  ) => {
    const current = answers[questionId]?.answer;
    const next =
      current && typeof current === "object" && !Array.isArray(current)
        ? { ...current, [leftItem]: selectedRight }
        : { [leftItem]: selectedRight };

    setAnswer(questionId, next);
  };

  const removeMatchingAnswer = (questionId: number, leftItem: string) => {
    const current = answers[questionId]?.answer;
    if (!current || typeof current !== "object" || Array.isArray(current)) return;

    const next = { ...current };
    delete next[leftItem];
    setAnswer(questionId, next);
  };

  const appendWordBankWord = (questionId: number, word: string) => {
    const current = answers[questionId]?.answer;
    const text = typeof current === "string" ? current : "";
    const next = text.trim() ? `${text} ${word}` : word;
    setAnswer(questionId, next);
  };

  const appendReorderWord = (questionId: number, word: string, index: number) => {
    const current = answers[questionId]?.answer;
    const selected = Array.isArray(current) ? current : [];
    const token = `${index}|||${word}`;

    if (selected.includes(token)) return;

    setAnswer(questionId, [...selected, token]);
  };

  const removeLastReorderWord = (questionId: number) => {
    const current = answers[questionId]?.answer;
    const selected = Array.isArray(current) ? current : [];
    setAnswer(questionId, selected.slice(0, -1));
  };

  const resetReorderAnswer = (questionId: number) => {
    setAnswer(questionId, []);
  };

  const getDisplayedReorderSentence = (questionId: number) => {
    const current = answers[questionId]?.answer;
    const selected = Array.isArray(current) ? current : [];
    return selected
      .map((item) => item.split("|||")[1] ?? "")
      .join(" ")
      .trim();
  };

  const canSubmitQuestion = (question: QuestionDto) => {
    const currentAnswer = getQuestionAnswer(question.id);
    if (!currentAnswer) return false;

    const answer = currentAnswer.answer;

    if (typeof answer === "string") {
      return answer.trim().length > 0;
    }

    if (Array.isArray(answer)) {
      return answer.length > 0;
    }

    if (typeof answer === "object" && answer !== null) {
      if (question.questionType === "MATCHING") {
        const answerMap = !Array.isArray(answer) ? answer : {};
        const leftItems = getMatchingData(question)?.left ?? [];

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
  };

  const submitStoredQuestion = async (
    question: QuestionDto,
    saved: NonNullable<AnswerState[number]>,
  ) => {
    let correct: boolean | null = null;
    let feedback: string | null = null;
    let score: number | null = null;
    let submitted = false;

    if (isMCQ(question.questionType)) {
      const selected = normalizeText(String(saved.answer));
      const correctOption = question.options.find((o) => o.isCorrect);
      correct = correctOption
        ? normalizeText(correctOption.optionKey) === selected ||
          normalizeText(correctOption.content) === selected
        : false;
    } else if (question.questionType === "TRUE_FALSE_NG") {
      const selected = normalizeText(String(saved.answer));
      const expected = getTrueFalseExpected(question);
      correct = selected === expected;
    } else if (isFillType(question.questionType)) {
      const typed = normalizeText(String(saved.answer));
      const expected = normalizeText(String(question.correctAnswer ?? ""));
      correct = typed === expected;
    } else if (question.questionType === "SENTENCE_REORDER") {
      const builtSentence = getDisplayedReorderSentence(question.id);
      const expected = normalizeText(String(question.correctAnswer ?? ""));
      correct = normalizeText(builtSentence) === expected;
    } else if (question.questionType === "MATCHING") {
      const answerMap =
        saved.answer &&
        typeof saved.answer === "object" &&
        !Array.isArray(saved.answer)
          ? saved.answer
          : {};

      const expectedMap =
        parseJsonSafe<Record<string, string>>(question.correctAnswer || "") ||
        getMatchingData(question)?.answers ||
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
    } else if (isManualType(question.questionType)) {
      correct = null;
    }

    const answerText = toAnswerText(saved.answer, question);

    if (question.questionType === "ESSAY_WRITING") {
      const res = await submitEssay({
        questionId: question.id,
        answerText,
      });

      if (res.success && res.data) {
        correct = null;
        feedback = res.data.feedback;
        score = res.data.score;
        submitted = true;
      } else if (!res.success) {
        setSubmitApiError(
          res.error?.message || "KhÃƒÂ´ng gÃ¡Â»Â­i Ã„â€˜Ã†Â°Ã¡Â»Â£c bÃƒ i essay lÃƒÂªn hÃ¡Â»â€¡ thÃ¡Â»â€˜ng.",
        );
      }
    } else {
      const res = await submitQuestionHistory({
        questionId: question.id,
        answer_text: answerText,
      });

      if (res.success && res.data) {
        correct = isManualType(question.questionType) ? null : res.data.correct;
        submitted = true;
      } else if (!res.success) {
        setSubmitApiError(
          res.error?.message || "KhÃ´ng gá»­i Ä‘Æ°á»£c cÃ¢u tráº£ lá»i lÃªn há»‡ thá»‘ng.",
        );
      }
    }

    return { submitted, correct, feedback, score };
  };

  const submitQuestion = async (question: QuestionDto) => {
    const saved = answers[question.id];
    if (!saved) return;

    setSubmittingCurrent(true);
    setSubmitApiError(null);

    try {
      let correct: boolean | null = null;
      let feedback: string | null = null;
      let score: number | null = null;
      let submitted = false;

      if (isMCQ(question.questionType)) {
        const selected = normalizeText(String(saved.answer));
        const correctOption = question.options.find((o) => o.isCorrect);
        correct = correctOption
          ? normalizeText(correctOption.optionKey) === selected ||
            normalizeText(correctOption.content) === selected
          : false;
      } else if (question.questionType === "TRUE_FALSE_NG") {
        const selected = normalizeText(String(saved.answer));
        const expected = getTrueFalseExpected(question);
        correct = selected === expected;
      } else if (isFillType(question.questionType)) {
        const typed = normalizeText(String(saved.answer));
        const expected = normalizeText(String(question.correctAnswer ?? ""));
        correct = typed === expected;
      } else if (question.questionType === "SENTENCE_REORDER") {
        const builtSentence = getDisplayedReorderSentence(question.id);
        const expected = normalizeText(String(question.correctAnswer ?? ""));
        correct = normalizeText(builtSentence) === expected;
      } else if (question.questionType === "MATCHING") {
        const answerMap =
          saved.answer &&
          typeof saved.answer === "object" &&
          !Array.isArray(saved.answer)
            ? saved.answer
            : {};

        const expectedMap =
          parseJsonSafe<Record<string, string>>(question.correctAnswer || "") ||
          getMatchingData(question)?.answers ||
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
      } else if (isManualType(question.questionType)) {
        correct = null;
      }

      const answerText = toAnswerText(saved.answer, question);

      if (question.questionType === "ESSAY_WRITING") {
        const res = await submitEssay({
          questionId: question.id,
          answerText,
        });

        if (res.success && res.data) {
          correct = null;
          feedback = res.data.feedback;
          score = res.data.score;
          submitted = true;
        } else if (!res.success) {
          setSubmitApiError(
            res.error?.message || "KhÃ´ng gá»­i Ä‘Æ°á»£c bÃ i essay lÃªn há»‡ thá»‘ng.",
          );
        }
      } else {

      const res = await submitQuestionHistory({
        questionId: question.id,
        answer_text: answerText,
      });

      if (res.success && res.data) {
        correct = isManualType(question.questionType) ? null : res.data.correct;
        submitted = true;
      } else if (!res.success) {
        setSubmitApiError(
          res.error?.message || "Không gửi được câu trả lời lên hệ thống.",
        );
      }

      }

      setAnswers((prev) => ({
        ...prev,
        [question.id]: {
          ...prev[question.id],
          submitted,
          correct,
          feedback,
          score,
        },
      }));
    } finally {
      setSubmittingCurrent(false);
    }
  };

  const submitCurrentItem = async () => {
    for (const question of currentQuestions) {
      if (!answers[question.id]?.submitted && canSubmitQuestion(question)) {
        await submitQuestion(question);
      }
    }
  };

  const goNext = async () => {
    if (currentIndex >= items.length - 1) {
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

  const renderQuestionHint = (question: QuestionDto, group: QuestionGroupDto | null) => {
    const hint = getQuestionHint(question, group);
    const showQuestionData =
      !!question.questionData &&
      question.questionType !== "MATCHING" &&
      question.questionType !== "SENTENCE_REORDER";

    if (!hint && !showQuestionData) return null;

    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 space-y-2">
        {hint && (
          <p>
            <span className="font-bold">Gợi ý:</span> {hint}
          </p>
        )}
        {showQuestionData && (
          <p>
            <span className="font-bold">Question data:</span> {question.questionData}
          </p>
        )}
      </div>
    );
  };

  const renderAnswerArea = (
    question: QuestionDto,
    group: QuestionGroupDto | null,
    compact = false,
  ) => {
    const currentAnswer = getQuestionAnswer(question.id);
    const wordBank = getWordBank(group);
    const reorderWords = getReorderWords(question);
    const matchingData = getMatchingData(question);

    if (isMCQ(question.questionType)) {
      return (
        <div className={`grid gap-3 ${compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 gap-4"}`}>
          {question.options.map((option) => {
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
                onClick={() => setAnswer(question.id, option.optionKey)}
                className={`text-left rounded-2xl border-2 transition-all ${compact ? "p-3.5" : "p-5"} ${extraClass}`}
              >
                <div className={`${compact ? "flex items-center gap-3" : "flex items-center gap-4"}`}>
                  <div className={`${compact ? "h-8 w-8 text-sm" : "w-10 h-10"} shrink-0 rounded-full bg-white border flex items-center justify-center font-black text-[#1e2e51]`}>
                    {option.optionKey}
                  </div>
                  <div className={`${compact ? "text-sm font-semibold" : "font-semibold"} text-[#1e2e51]`}>
                    {option.content}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    if (question.questionType === "TRUE_FALSE_NG") {
      const values = ["true", "false", "not given"];

      return (
        <div className={`grid gap-3 ${compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3 gap-4"}`}>
          {values.map((value) => {
            const selected = currentAnswer?.answer === value;
            const submitted = currentAnswer?.submitted;

            let extraClass =
              "border-gray-200 bg-white hover:border-[#155ca5]/40 hover:bg-[#f8fbff]";

            if (submitted) {
              const expected = getTrueFalseExpected(question);
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
                onClick={() => setAnswer(question.id, value)}
                className={`rounded-2xl border-2 font-bold uppercase transition-all ${compact ? "p-3.5 text-sm" : "p-5"} ${extraClass}`}
              >
                {value}
              </button>
            );
          })}
        </div>
      );
    }

    if (
      question.questionType === "LIMITED_FILL" ||
      question.questionType === "WORD_FORM" ||
      question.questionType === "VERB_FORM"
    ) {
      return (
        <div className="space-y-3">
          <input
            type="text"
            disabled={currentAnswer?.submitted}
            value={typeof currentAnswer?.answer === "string" ? currentAnswer.answer : ""}
            onChange={(e) => setAnswer(question.id, e.target.value)}
            placeholder="Nhập câu trả lời..."
            className="w-full rounded-2xl border border-gray-300 px-5 py-4 outline-none focus:border-[#155ca5]"
          />
        </div>
      );
    }

    if (question.questionType === "WORD_BANK_FILL") {
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
                    onClick={() => appendWordBankWord(question.id, word)}
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
            onChange={(e) => setAnswer(question.id, e.target.value)}
            placeholder="Điền từ hoặc bấm từ trong Word Bank..."
            className="w-full rounded-2xl border border-gray-300 px-5 py-4 outline-none focus:border-[#155ca5]"
          />
        </div>
      );
    }

    if (question.questionType === "SENTENCE_REORDER") {
      const selectedTokens = Array.isArray(currentAnswer?.answer)
        ? currentAnswer.answer
        : [];

      return (
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#dbeafe] bg-[#f8fbff] p-5">
            <p className="text-sm font-bold text-[#155ca5] mb-3">Your sentence</p>
            <div className="min-h-[60px] rounded-2xl border border-dashed border-[#9bc2ff] bg-white p-4 text-lg font-semibold text-[#1e2e51]">
              {getDisplayedReorderSentence(question.id) || "Chưa chọn từ nào"}
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                type="button"
                disabled={currentAnswer?.submitted || selectedTokens.length === 0}
                onClick={() => removeLastReorderWord(question.id)}
                className="px-4 py-2 rounded-xl border border-gray-300 font-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                Undo
              </button>
              <button
                type="button"
                disabled={currentAnswer?.submitted || selectedTokens.length === 0}
                onClick={() => resetReorderAnswer(question.id)}
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
                    onClick={() => appendReorderWord(question.id, word, index)}
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

    if (question.questionType === "MATCHING") {
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
          {rightItems.length > 0 && (
            <div className="rounded-2xl border border-[#dbeafe] bg-[#f8fbff] p-4">
              <p className="text-sm font-bold text-[#155ca5] mb-3">Đáp án để ghép</p>
              <div className="flex flex-wrap gap-2">
                {rightItems.map((rightItem) => {
                  const isUsed = usedRightValues.has(String(rightItem).trim());
                  return (
                    <span
                      key={`matching-bank-${rightItem}`}
                      className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                        isUsed
                          ? "bg-gray-100 text-gray-400 line-through"
                          : "border border-[#bfd8ff] bg-white text-[#155ca5]"
                      }`}
                    >
                      {rightItem}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

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
                          updateMatchingAnswer(question.id, leftItem, dropped);
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
                          <span className="text-gray-400 text-sm">Chọn hoặc kéo đáp án vào đây</span>
                        )}

                        {selectedValue && !currentAnswer?.submitted && (
                          <button
                            type="button"
                            onClick={() => removeMatchingAnswer(question.id, leftItem)}
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

    if (question.questionType === "SENTENCE_REWRITE") {
      return (
        <textarea
          rows={4}
          disabled={currentAnswer?.submitted}
          value={typeof currentAnswer?.answer === "string" ? currentAnswer.answer : ""}
          onChange={(e) => setAnswer(question.id, e.target.value)}
          placeholder="Viết lại câu ở đây..."
          className="w-full rounded-2xl border border-gray-300 px-5 py-4 outline-none focus:border-[#155ca5] resize-none"
        />
      );
    }

    if (question.questionType === "ESSAY_WRITING") {
      return (
        <textarea
          rows={8}
          disabled={currentAnswer?.submitted}
          value={typeof currentAnswer?.answer === "string" ? currentAnswer.answer : ""}
          onChange={(e) => setAnswer(question.id, e.target.value)}
          placeholder="Write your essay here..."
          className="w-full rounded-2xl border border-gray-300 px-5 py-4 outline-none focus:border-[#155ca5] resize-y"
        />
      );
    }

    if (
      question.questionType === "PRONUNCIATION" ||
      question.questionType === "TOPIC_SPEAKING"
    ) {
      const speakingActive =
        isListening && speechSessionQuestionId === question.id;

      return (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 space-y-4">
          <p className="font-bold text-[#1e2e51]">
            Dạng {getQuestionTypeLabel(question.questionType)}
          </p>
          <p className="text-sm text-gray-600">
            Nhấn "Bắt đầu nói" để hệ thống nghe và tự hiện chữ vào ô transcript.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {!speakingActive ? (
              <button
                type="button"
                disabled={currentAnswer?.submitted || !speechSupported}
                onClick={() => startSpeechCapture(question)}
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
            onChange={(e) => setAnswer(question.id, e.target.value)}
            placeholder="Transcript se hien tai day khi ban noi..."
            className="w-full rounded-2xl border border-gray-300 px-5 py-4 outline-none focus:border-[#155ca5] resize-none bg-white"
          />
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6">
        <p className="font-bold text-[#1e2e51]">
          Chưa hỗ trợ UI cho dạng {getQuestionTypeLabel(question.questionType)}
        </p>
      </div>
    );
  };

  const renderFeedback = (question: QuestionDto) => {
    const currentAnswer = getQuestionAnswer(question.id);
    if (!currentAnswer?.submitted) return null;

    const isUngraded = currentAnswer.correct === null;
    const isManualQuestion = isManualType(question.questionType);
    const hasAiWritingResult =
      question.questionType === "ESSAY_WRITING" &&
      (typeof currentAnswer.score === "number" || !!currentAnswer.feedback);

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
                ? isManualType(question.questionType)
                  ? "Đã nộp, chờ đánh giá"
                  : question.questionType === "MATCHING"
                    ? "Đã nộp, chưa có đáp án chuẩn để tự chấm"
                    : "Đã nộp"
                : currentAnswer.correct
                  ? "Chính xác!"
                  : "Chưa đúng"}
            </p>

            {!isManualQuestion && question.explanation && (
              <p className="text-gray-700">{question.explanation}</p>
            )}

            {typeof currentAnswer.score === "number" && (
              <p className="text-sm font-semibold text-[#155ca5]">
                Essay score: {currentAnswer.score}
              </p>
            )}

            {currentAnswer.feedback && (
              <p className="text-sm text-gray-700">
                Nháº­n xÃ©t AI: {currentAnswer.feedback}
              </p>
            )}

            {false &&
              !currentAnswer.correct &&
              question.correctAnswer && (
                <p className="text-sm font-semibold text-gray-600">
                  Đáp án đúng: {question.correctAnswer}
                </p>
              )}

            {question.questionType === "MATCHING" &&
              currentAnswer.correct === null && (
                <p className="text-sm text-gray-600">
                  Matching chỉ tự chấm khi backend trả về `correctAnswer` hoặc mapping đáp án đầy đủ.
                </p>
              )}

            {isManualQuestion && (
              <p className="text-sm text-gray-600">
                Dạng này đã được gửi đi, hệ thống sẽ dùng nội dung bạn nộp để đánh giá thay vì chấm đúng/sai ngay.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const isCurrentItemComplete = currentQuestions.every(
    (question) => answers[question.id]?.submitted,
  );

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

  if (!data || totalQuestions === 0 || items.length === 0) {
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
              Đã nộp: {totalSubmitted}/{totalQuestions} câu
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
                onClick={() => {
                  if (nextLesson) {
                    navigate(`/lessons/${nextLesson.lessonId}`);
                    return;
                  }
                  navigate(`/sections/${sectionId}/lessons`);
                }}
                className="px-6 py-3 rounded-xl bg-[#27ae60] text-white font-bold hover:bg-[#1f8b4d]"
              >
                {nextLesson ? "Next Lesson" : "Ve lesson list"}
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  if (!currentItem || currentQuestions.length === 0) return null;

  return (
    <main className={`${isListeningItem ? "max-w-7xl" : "max-w-6xl"} mx-auto px-4 md:px-6 py-6 md:py-8 pb-24`}>
      <section className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[#155ca5] font-bold hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          Quay lại
        </Link>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <span className="inline-block px-3 py-1 rounded-full bg-[#73aaf9]/20 text-[#155ca5] text-xs font-bold uppercase tracking-wider">
              Lesson {lessonId}
            </span>
            <span className="text-sm font-bold text-gray-500">
              Màn {currentIndex + 1}/{items.length}
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

      <section className={isCompactPassageItem ? "grid gap-4 xl:grid-cols-[minmax(420px,1.08fr)_minmax(0,0.92fr)] xl:items-start" : "space-y-4"}>
        {isCompactPassageItem ? (
          <div className="xl:sticky xl:top-6">
            <GroupSharedContent group={currentGroup} />
          </div>
        ) : (
          <GroupSharedContent group={currentGroup} />
        )}

        <div className="space-y-4">
          {currentGroup && currentQuestions.length > 1 && !isCompactPassageItem && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#155ca5]">
                    Group Questions
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Chuyển từng câu trong cùng một màn để đỡ cuộn dài.
                  </p>
                </div>
                <div className="rounded-full bg-[#155ca5]/10 px-3 py-1.5 text-sm font-bold text-[#155ca5]">
                  Câu {activeQuestionIndex + 1}/{currentQuestions.length}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {currentQuestions.map((question, index) => {
                  const state = getQuestionAnswer(question.id);
                  const active = index === activeQuestionIndex;
                  const buttonClass = active
                    ? "border-[#155ca5] bg-[#155ca5] text-white"
                    : state?.submitted
                      ? state.correct === true
                        ? "border-green-300 bg-green-50 text-green-700"
                        : state.correct === false
                          ? "border-red-300 bg-red-50 text-red-700"
                          : "border-amber-300 bg-amber-50 text-amber-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-[#155ca5]/35 hover:bg-[#f8fbff]";

                  return (
                    <button
                      key={`group-nav-${question.id}`}
                      type="button"
                      onClick={() => setCurrentGroupQuestionIndex(index)}
                      className={`flex min-w-10 items-center justify-center rounded-full border px-3 py-2 text-sm font-black transition ${buttonClass}`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {visibleQuestions.map((question) => {
            const questionIndex = currentQuestions.findIndex((item) => item.id === question.id);
            const questionAnswer = getQuestionAnswer(question.id);
            const mediaImageUrl = getQuestionImageUrl(currentGroup, question);
            const mediaAudioUrl = isListeningItem
              ? question.audioUrl && question.audioUrl !== currentGroup?.audioUrl
                ? getQuestionAudioUrl(currentGroup, question)
                : null
              : getQuestionAudioUrl(currentGroup, question);

            return (
              <div
                key={question.id}
                className={`bg-white shadow-sm ${isCompactPassageItem ? "rounded-2xl p-4 space-y-4" : "rounded-3xl p-5 md:p-6 space-y-5"}`}
              >
                <div className={isCompactPassageItem ? "space-y-2" : "space-y-3"}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className={`inline-flex items-center justify-center rounded-full bg-[#155ca5] px-3 font-black text-white ${isCompactPassageItem ? "h-8 min-w-8 text-xs" : "h-9 min-w-9 text-sm"}`}>
                        {questionIndex + 1}
                      </div>
                      <div className="inline-block px-3 py-1 rounded-full bg-[#f3f7ff] text-[#155ca5] text-xs font-bold uppercase tracking-wider">
                        {getQuestionTypeLabel(question.questionType)}
                      </div>
                    </div>

                    <div className="text-xs font-semibold text-gray-500">
                      {questionAnswer?.submitted
                        ? questionAnswer.correct === null
                          ? "Đã nộp"
                          : questionAnswer.correct
                            ? "Đúng"
                            : "Sai"
                        : "Chưa nộp"}
                    </div>
                  </div>

                  {question.instruction && (
                    <p className={`${isCompactPassageItem ? "text-xs" : "text-sm"} font-medium text-gray-500`}>
                      {question.instruction}
                    </p>
                  )}

                  <h2 className={`${isCompactPassageItem ? "text-base md:text-lg" : "text-xl md:text-2xl"} font-black text-[#1e2e51] leading-tight`}>
                    {question.content}
                  </h2>
                </div>

                <MediaBlock imageUrl={mediaImageUrl} audioUrl={mediaAudioUrl} />

                {renderQuestionHint(question, currentGroup)}

                {renderAnswerArea(question, currentGroup, isCompactPassageItem)}

                {renderFeedback(question)}

                {!isListeningItem && !isCompactPassageItem && (
                  <div className={`flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 ${isCompactPassageItem ? "pt-3" : "pt-4"}`}>
                    {currentGroup && !isCompactPassageItem ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCurrentGroupQuestionIndex((prev) => Math.max(prev - 1, 0))}
                          disabled={activeQuestionIndex === 0}
                          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-[#155ca5] hover:text-[#155ca5] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Câu trước
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentGroupQuestionIndex((prev) =>
                              Math.min(prev + 1, currentQuestions.length - 1),
                            )
                          }
                          disabled={activeQuestionIndex >= currentQuestions.length - 1}
                          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-[#155ca5] hover:text-[#155ca5] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Câu sau
                        </button>
                      </div>
                    ) : (
                      <div />
                    )}

                    {!questionAnswer?.submitted && (
                      <button
                        onClick={() => void submitQuestion(question)}
                        disabled={!canSubmitQuestion(question) || submittingCurrent}
                        className={`rounded-xl bg-[#155ca5] text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0f4c88] ${isCompactPassageItem ? "px-4 py-2.5 text-sm" : "px-6 py-3"}`}
                      >
                        {submittingCurrent ? "Đang nộp..." : "Nộp câu trả lời"}
                      </button>
                    )}
                  </div>
                )}

                {!isListeningItem && false && (
                <div className="flex items-center justify-end gap-3">
                  {!questionAnswer?.submitted && (
                    <button
                      onClick={() => void submitQuestion(question)}
                      disabled={!canSubmitQuestion(question) || submittingCurrent}
                      className="px-6 py-3 rounded-xl bg-[#155ca5] text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0f4c88]"
                    >
                      {submittingCurrent ? "Đang nộp..." : "Nộp câu trả lời"}
                    </button>
                  )}
                </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <footer className="mt-8 flex items-center justify-between gap-4 flex-wrap">
        <div className="text-sm text-gray-500 font-medium">
          Đúng {totalCorrect}/{totalQuestions} câu | Hoàn thành {submittedPercent}%
        </div>

        <div className="flex items-center gap-3">
          {isCompactPassageItem && !isCurrentItemComplete && (
            <button
              onClick={() => void submitCurrentItem()}
              disabled={
                submittingCurrent ||
                currentQuestions.some((question) => !canSubmitQuestion(question))
              }
              className="px-6 py-3 rounded-xl bg-[#155ca5] text-white font-bold hover:bg-[#0f4c88] disabled:opacity-60"
            >
              {submittingCurrent
                ? "\u0110ang n\u1ed9p..."
                : isListeningItem
                  ? "N\u1ed9p to\u00e0n b\u1ed9 c\u00e2u nghe"
                  : "N\u1ed9p to\u00e0n b\u1ed9 c\u00e2u h\u1ecfi"}
            </button>
          )}
          {false && isCompactPassageItem && !isCurrentItemComplete && (
            <button
              onClick={() => void submitCurrentItem()}
              disabled={
                submittingCurrent ||
                currentQuestions.some((question) => !canSubmitQuestion(question))
              }
              className="px-6 py-3 rounded-xl bg-[#155ca5] text-white font-bold hover:bg-[#0f4c88] disabled:opacity-60"
            >
              {submittingCurrent ? "Äang ná»™p..." : "Ná»™p toÃ n bá»™ cÃ¢u nghe"}
            </button>
          )}
          <button
            onClick={goNext}
            disabled={!isCurrentItemComplete || (currentIndex === items.length - 1 && completingLesson)}
            className="px-6 py-3 rounded-xl bg-[#27ae60] text-white font-bold hover:bg-[#1f8b4d] disabled:opacity-60"
          >
            {currentIndex === items.length - 1
              ? completingLesson
                ? "Đang lưu kết quả..."
                : "Kết thúc"
              : currentGroup
                ? "Nhóm tiếp theo"
                : "Câu tiếp"}
          </button>
        </div>

        {submitApiError && (
          <p className="w-full text-sm text-red-600">{submitApiError}</p>
        )}
      </footer>
    </main>
  );
}

export default LessonRunner;
