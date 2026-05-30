import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import {
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  Mic,
  MicOff,
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  XCircle,
} from "lucide-react";
import {
  completeLesson,
  getLessonById,
  getLessonsBySectionProgress,
  getQuestionsByLesson,
  getSection,
  submitEssay,
  submitEssayWithImage,
  submitQuestionHistory,
} from "@/api";
import { ENV } from "@/config/env";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  clearRunnerState,
  readRunnerState,
  writeRunnerState,
} from "@/app/utils/runnerStorage";
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
    attemptCount?: number;
    maxAttempts?: number;
    expectedAnswer?: string | null;
    recognizedText?: string | null;
    similarity?: number | null;
    issueSummary?: string | null;
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
  orderIndex?: number | null;
  reviewLesson: boolean;
  completed: boolean;
  unlocked: boolean;
  current: boolean;
};

type FlagState = Record<number, boolean>;

type EliminatedOptionState = Record<number, string[]>;
type EssayAttachmentState = Record<
  number,
  {
    file: File | null;
  }
>;

type PersistedLessonRunnerState = {
  version: 1;
  lessonId: number;
  data: LessonQuestionResponse | null;
  currentIndex: number;
  currentGroupQuestionIndex: number;
  pendingGroupQuestionIndex: number | null;
  answers: AnswerState;
  flaggedQuestions: FlagState;
  eliminatedOptions: EliminatedOptionState;
  selectedMatchingAnswers: Record<number, string>;
  finished: boolean;
};

const LESSON_RUNNER_STATE_TTL_MS = 24 * 60 * 60 * 1000;

function getLessonRunnerStorageKey(lessonId: number) {
  return `lesson:${lessonId}`;
}

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
  return type === "ESSAY_WRITING";
}

function isSpeechType(type: QuestionType) {
  return ["PRONUNCIATION", "TOPIC_SPEAKING"].includes(type);
}

function isAutoGradedType(type: QuestionType) {
  return !isManualType(type);
}

function normalizeText(value: string) {
  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function levenshteinDistance(left: string, right: string) {
  const rows = left.length + 1;
  const cols = right.length + 1;
  const matrix = Array.from({ length: rows }, () =>
    Array<number>(cols).fill(0),
  );

  for (let row = 0; row < rows; row += 1) matrix[row][0] = row;
  for (let col = 0; col < cols; col += 1) matrix[0][col] = col;

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const cost = left[row - 1] === right[col - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost,
      );
    }
  }

  return matrix[left.length][right.length];
}

function calculateTextSimilarity(left: string, right: string) {
  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);

  if (!normalizedLeft || !normalizedRight) return 0;
  if (normalizedLeft === normalizedRight) return 1;
  if (
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  ) {
    return 0.92;
  }

  const leftTokens = normalizedLeft.split(" ").filter(Boolean);
  const rightTokens = normalizedRight.split(" ").filter(Boolean);
  const sharedTokens = leftTokens.filter((token) =>
    rightTokens.includes(token),
  ).length;
  const tokenScore =
    Math.max(leftTokens.length, rightTokens.length) > 0
      ? sharedTokens / Math.max(leftTokens.length, rightTokens.length)
      : 0;

  const distance = levenshteinDistance(normalizedLeft, normalizedRight);
  const charScore =
    1 - distance / Math.max(normalizedLeft.length, normalizedRight.length, 1);

  return Math.max(tokenScore, charScore);
}

function calculateTokenCoverage(left: string, right: string) {
  const leftTokens = normalizeText(left).split(" ").filter(Boolean);
  const rightTokens = normalizeText(right).split(" ").filter(Boolean);

  if (leftTokens.length === 0 || rightTokens.length === 0) return 0;

  const sharedTokens = leftTokens.filter((token) =>
    rightTokens.includes(token),
  ).length;
  return sharedTokens / Math.max(leftTokens.length, rightTokens.length);
}

function getSentenceReorderAnswerText(answer: UserAnswer) {
  if (typeof answer === "string") {
    return answer.trim();
  }

  if (Array.isArray(answer)) {
    return answer
      .map((item) => item.split("|||")[1] ?? item)
      .join(" ")
      .trim();
  }

  return "";
}

function getPronunciationExpectedAnswer(question: QuestionDto) {
  const mcqCorrectOption = question.options.find(
    (option) => option.isCorrect,
  )?.content;
  return (
    question.correctAnswer?.trim() ||
    mcqCorrectOption?.trim() ||
    question.content?.trim() ||
    ""
  );
}

function evaluatePronunciationAttempt(
  question: QuestionDto,
  transcript: string,
) {
  const expected = getPronunciationExpectedAnswer(question);
  const similarityByTokens = calculateTokenCoverage(transcript, expected);
  const similarityByText = calculateTextSimilarity(transcript, expected);
  const similarityScore = Math.max(similarityByTokens, similarityByText);
  const passed = similarityByTokens >= 0.5 || similarityByText >= 0.72;
  const similarity = similarityScore;
  const correct = passed;

  return {
    correct: passed,
    similarity: similarityScore,
    expectedAnswer: expected,
    recognizedText: transcript.trim(),
    feedback: passed
      ? `Bài nói đã khớp đủ tốt với câu mẫu (${Math.round(similarity * 100)}%).`
      : `Bài nói chưa khớp đủ với câu mẫu (${Math.round(similarity * 100)}%).`,
    issueSummary: passed
      ? "Đã đạt yêu cầu phát âm/đọc."
      : "Cần nói lại để khớp câu mẫu hơn.",
  };
  const legacySimilarity = calculateTextSimilarity(transcript, expected);
  const legacyCorrect = legacySimilarity >= 0.72;

  return {
    correct: legacyCorrect,
    similarity: legacySimilarity,
    expectedAnswer: expected,
    recognizedText: transcript.trim(),
    feedback: correct
      ? `Hệ thống nhận diện khá khớp với câu mẫu (${Math.round(similarity * 100)}%).`
      : `Hệ thống nghe được "${transcript.trim() || "..."}", chưa đủ gần với câu mẫu (${Math.round(similarity * 100)}%).`,
    issueSummary: correct
      ? "Phát âm/đọc đã đủ gần câu mẫu."
      : "Transcript hệ thống nghe được chưa khớp đủ với câu mẫu.",
  };
}

function getTrueFalseExpected(question: QuestionDto) {
  const correctOption = question.options.find((option) => option.isCorrect);
  return normalizeText(
    String(correctOption?.content || question.correctAnswer || ""),
  );
}

function parseJsonSafe<T>(value?: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function renderFormattedInlineText(value: string): ReactNode[] {
  const segments = value.split(
    /(<strong>.*?<\/strong>|<b>.*?<\/b>|\*\*.*?\*\*|<u>.*?<\/u>|__.*?__|\[\[.*?\]\])/gi,
  );

  return segments
    .filter((segment) => segment.length > 0)
    .map((segment, index) => {
      const htmlStrong = segment.match(/^<strong>(.*?)<\/strong>$/i);
      const htmlBold = segment.match(/^<b>(.*?)<\/b>$/i);
      const markdownBold = segment.match(/^\*\*(.*?)\*\*$/);
      const htmlUnderline = segment.match(/^<u>(.*?)<\/u>$/i);
      const markdownUnderline = segment.match(/^__(.*?)__$/);
      const bracketUnderline = segment.match(/^\[\[(.*?)\]\]$/);
      const boldText = htmlStrong?.[1] ?? htmlBold?.[1] ?? markdownBold?.[1];
      const underlinedText =
        htmlUnderline?.[1] ?? markdownUnderline?.[1] ?? bracketUnderline?.[1];

      if (boldText != null) {
        return (
          <strong
            key={`${boldText}-${index}`}
            className="font-black text-[#16315c]"
          >
            {boldText}
          </strong>
        );
      }

      if (underlinedText != null) {
        return (
          <u
            key={`${underlinedText}-${index}`}
            className="font-semibold decoration-2 underline-offset-2"
          >
            {underlinedText}
          </u>
        );
      }

      return <span key={`${segment}-${index}`}>{segment}</span>;
    });
}

function renderTextWithBreaks(value?: string | null) {
  if (!value?.trim()) return null;

  return value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line, index) => (
      <p key={`${line}-${index}`} className={index > 0 ? "mt-2" : undefined}>
        {line ? renderFormattedInlineText(line) : "\u00A0"}
      </p>
    ));
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
        ? Object.entries(parsed.answers as Record<string, unknown>).reduce<
            Record<string, string>
          >((acc, [key, rawValue]) => {
            if (key && rawValue != null) {
              acc[String(key).trim()] = String(rawValue).trim();
            }
            return acc;
          }, {})
        : {};

    const left = Array.isArray(parsed.left)
      ? parsed.left
          .map(String)
          .map((item) => item.trim())
          .filter(Boolean)
      : Object.keys(answers);
    const right = Array.isArray(parsed.right)
      ? parsed.right
          .map(String)
          .map((item) => item.trim())
          .filter(Boolean)
      : Array.from(new Set(Object.values(answers)));

    return { left, right, answers };
  }

  const answers = Object.entries(parsed).reduce<Record<string, string>>(
    (acc, [key, rawValue]) => {
      if (key && rawValue != null) {
        acc[String(key).trim()] = String(rawValue).trim();
      }
      return acc;
    },
    {},
  );

  if (Object.keys(answers).length === 0) {
    return null;
  }

  return {
    left: Object.keys(answers),
    right: Array.from(new Set(Object.values(answers))),
    answers,
  };
}

function isFillBlankToken(value: string) {
  return (
    /^_{2,}$/.test(value) ||
    /^\(\s*\.\.\.\s*\)$/.test(value) ||
    /^\[\s*\.\.\.\s*\]$/.test(value)
  );
}

function splitFillSentence(content?: string | null) {
  if (!content?.trim()) return null;

  const pattern = /(_{2,}|\(\s*\.\.\.\s*\)|\[\s*\.\.\.\s*\])/g;
  const parts = content.split(pattern);
  const hasBlank = parts.some((part) => isFillBlankToken(part));

  if (!hasBlank) return null;
  return parts;
}

type PassageSegment =
  | {
      type: "text";
      value: string;
    }
  | {
      type: "blank";
      label: string;
      choices: string[];
    };

function parsePassageInlineSegments(content?: string | null): PassageSegment[] {
  if (!content?.trim()) return [];

  const regex = /(\(\d+\)\s*\[[^\]]+\])/g;
  const parts = content.split(regex).filter((part) => part.length > 0);

  return parts.map((part) => {
    const match = part.match(/^\((\d+)\)\s*\[([^\]]+)\]$/);
    if (!match) {
      return {
        type: "text",
        value: part,
      };
    }

    return {
      type: "blank",
      label: match[1],
      choices: match[2]
        .split("|")
        .map((choice) => choice.trim())
        .filter(Boolean),
    };
  });
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

function getQuestionImageUrl(
  group: QuestionGroupDto | null,
  question: QuestionDto,
) {
  return resolveMediaUrl(question.imageUrl || group?.imageUrl || null);
}

function getQuestionAudioUrl(
  group: QuestionGroupDto | null,
  question: QuestionDto,
) {
  return resolveMediaUrl(question.audioUrl || group?.audioUrl || null);
}

function MediaBlock({
  imageUrl,
  audioUrl,
  syncText,
}: {
  imageUrl?: string | null;
  audioUrl?: string | null;
  syncText?: string | null;
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

      {audioUrl && <SmartAudioPlayer audioUrl={audioUrl} syncText={syncText} />}
    </div>
  );
}

function SmartAudioPlayer({
  audioUrl,
  syncText,
}: {
  audioUrl: string;
  syncText?: string | null;
}) {
  const { copy } = useLanguage();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const words = useMemo(() => {
    if (!syncText) return [] as string[];
    return syncText.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  }, [syncText]);

  const applyPlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const togglePlayback = async () => {
    if (!audioRef.current) return;
    try {
      if (audioRef.current.paused) {
        await audioRef.current.play();
        setIsPlaying(true);
        return;
      }
      audioRef.current.pause();
      setIsPlaying(false);
    } catch (err) {
      console.error("Audio play error", err);
    }
  };

  const replayLastFiveSeconds = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(
      audioRef.current.currentTime - 5,
      0,
    );
    if (audioRef.current.paused) {
      void audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current || words.length === 0) return;
    const dur = audioRef.current.duration || 1;
    const progress = Math.min(
      1,
      Math.max(0, audioRef.current.currentTime / dur),
    );
    const idx = Math.floor(progress * words.length);
    setHighlightIndex(idx);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setHighlightIndex(words.length);
  };

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    setHighlightIndex(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [audioUrl, syncText]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <audio
        ref={audioRef}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEnded}
        onTimeUpdate={handleTimeUpdate}
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
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isPlaying
              ? copy("Pause", "Tạm dừng")
              : copy("Play audio", "Phát audio")}
          </button>
          <button
            type="button"
            onClick={replayLastFiveSeconds}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <SkipBack className="h-4 w-4" />
            {copy("Back 5 seconds", "Lùi 5 giây")}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {[
            { label: copy("Slow", "Chậm"), value: 0.8 },
            { label: copy("Normal", "Bình thường"), value: 1 },
            { label: copy("Fast", "Nhanh"), value: 1.2 },
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

      {words.length > 0 && (
        <div className="mt-4 text-sm leading-relaxed">
          {words.map((w, i) => (
            <span
              key={i}
              className={
                i < highlightIndex
                  ? "text-amber-500 font-semibold"
                  : "text-gray-700"
              }
            >
              {w}
              {i < words.length - 1 ? " " : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function GroupSharedContent({
  group,
  hideSharedContent = false,
  compact = false,
}: {
  group: QuestionGroupDto | null;
  hideSharedContent?: boolean;
  compact?: boolean;
}) {
  if (!group) return null;

  const hasContent =
    group.title ||
    group.instruction ||
    group.sharedContent ||
    group.imageUrl ||
    group.audioUrl;

  if (!hasContent) return null;

  if (compact) {
    return (
      <div className="rounded-2xl border border-[#dbeafe] bg-[#f8fbff] px-5 py-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {group.title && (
            <h3 className="text-lg font-black text-[#1e2e51]">{group.title}</h3>
          )}

          {group.groupType && (
            <span className="inline-flex items-center rounded-full bg-white border border-[#cfe3ff] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#155ca5]">
              {group.groupType.replaceAll("_", " ")}
            </span>
          )}
        </div>

        {group.instruction && (
          <div className="text-sm font-medium text-[#155ca5]">
            {renderTextWithBreaks(group.instruction)}
          </div>
        )}

        {group.sharedContent && !hideSharedContent && (
          <div className="rounded-2xl border border-[#e5eefc] bg-white/80 p-4 text-base leading-7 text-[#1e2e51] [&_strong]:font-black">
            {renderTextWithBreaks(group.sharedContent)}
          </div>
        )}

        <MediaBlock
          imageUrl={group.imageUrl}
          audioUrl={group.audioUrl}
          syncText={group.sharedContent}
        />
      </div>
    );
  }

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
            <div className="text-sm md:text-base font-medium text-[#155ca5]">
              {renderTextWithBreaks(group.instruction)}
            </div>
          )}
        </div>

        {group.groupType && (
          <span className="inline-flex items-center rounded-full bg-white border border-[#cfe3ff] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#155ca5]">
            {group.groupType.replaceAll("_", " ")}
          </span>
        )}
      </div>

      {group.sharedContent && !hideSharedContent && (
        <div className="text-base text-gray-700 leading-7 rounded-2xl bg-white/70 border border-[#e5eefc] p-5 [&_strong]:font-black">
          {renderTextWithBreaks(group.sharedContent)}
        </div>
      )}

      <MediaBlock
        imageUrl={group.imageUrl}
        audioUrl={group.audioUrl}
        syncText={group.sharedContent}
      />
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
  const { copy } = useLanguage();
  const { refreshCurrentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lessonIdNumber = useMemo(() => Number(lessonId), [lessonId]);
  const isAdminPreview =
    searchParams.get("preview") === "admin" ||
    location.pathname.startsWith("/admin/content/preview/");

  const [data, setData] = useState<LessonQuestionResponse | null>(null);
  const [items, setItems] = useState<RunnerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentGroupQuestionIndex, setCurrentGroupQuestionIndex] = useState(0);
  const [pendingGroupQuestionIndex, setPendingGroupQuestionIndex] = useState<
    number | null
  >(null);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [essayAttachments, setEssayAttachments] =
    useState<EssayAttachmentState>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<FlagState>({});
  const [eliminatedOptions, setEliminatedOptions] =
    useState<EliminatedOptionState>({});
  const [finished, setFinished] = useState(false);
  const [submittingCurrent, setSubmittingCurrent] = useState(false);
  const [submitApiError, setSubmitApiError] = useState<string | null>(null);
  const [completingLesson, setCompletingLesson] = useState(false);
  const [completeApiError, setCompleteApiError] = useState<string | null>(null);
  const [lessonReward, setLessonReward] = useState<LessonRewardState | null>(
    null,
  );
  const [sectionId, setSectionId] = useState<number | null>(null);
  const [unitId, setUnitId] = useState<number | null>(null);
  const [sectionLessons, setSectionLessons] = useState<
    SectionLessonProgressItem[]
  >([]);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [speechPreview, setSpeechPreview] = useState("");
  const [speechSessionQuestionId, setSpeechSessionQuestionId] = useState<
    number | null
  >(null);
  const [selectedMatchingAnswers, setSelectedMatchingAnswers] = useState<
    Record<number, string>
  >({});
  const [runnerStateReady, setRunnerStateReady] = useState(false);
  const hasRestoredRunnerPositionRef = useRef(false);
  const answersRef = useRef<AnswerState>({});
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
  const speechRestartAttemptsRef = useRef(0);
  const speechManualStopRef = useRef(false);
  const speechTranscriptRef = useRef("");
  const speechPreviewRef = useRef("");
  const questionViewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    setRunnerStateReady(false);
    stopSpeechCapture();
    setCurrentIndex(0);
    setCurrentGroupQuestionIndex(0);
    setPendingGroupQuestionIndex(null);
    setAnswers({});
    setEssayAttachments({});
    setFlaggedQuestions({});
    setEliminatedOptions({});
    setSelectedMatchingAnswers({});
    setFinished(false);
    setSubmittingCurrent(false);
    setSubmitApiError(null);
    setCompletingLesson(false);
    setCompleteApiError(null);
    setLessonReward(null);
    setSectionId(null);
    setUnitId(null);
    setSectionLessons([]);
    setSpeechPreview("");
    setSpeechSessionQuestionId(null);
    setSpeechError(null);

    if (lessonIdNumber && Number.isFinite(lessonIdNumber)) {
      const persistedState = readRunnerState<PersistedLessonRunnerState>(
        getLessonRunnerStorageKey(lessonIdNumber),
      );

      if (persistedState && persistedState.lessonId === lessonIdNumber) {
        setData(persistedState.data);
        setItems(persistedState.data ? buildRunnerItems(persistedState.data) : []);
        setCurrentIndex(persistedState.currentIndex ?? 0);
        setCurrentGroupQuestionIndex(persistedState.currentGroupQuestionIndex ?? 0);
        setPendingGroupQuestionIndex(persistedState.pendingGroupQuestionIndex ?? null);
        setAnswers(persistedState.answers ?? {});
        setFlaggedQuestions(persistedState.flaggedQuestions ?? {});
        setEliminatedOptions(persistedState.eliminatedOptions ?? {});
        setSelectedMatchingAnswers(persistedState.selectedMatchingAnswers ?? {});
        setFinished(Boolean(persistedState.finished));
        if (persistedState.data) {
          setLoading(false);
        }
      }
    }

    hasRestoredRunnerPositionRef.current = true;
    setRunnerStateReady(true);
  }, [lessonIdNumber]);

  useEffect(() => {
    const loadQuestions = async () => {
      if (!lessonIdNumber || Number.isNaN(lessonIdNumber)) {
        setError("Lesson ID không hợp lệ");
        setLoading(false);
        return;
      }

      const storageKey = getLessonRunnerStorageKey(lessonIdNumber);
      const cachedState = readRunnerState<PersistedLessonRunnerState>(storageKey);
      const hasCachedData = Boolean(cachedState?.data);

      try {
        if (!hasCachedData) {
          setLoading(true);
        }
        setError(null);

        const res = await getQuestionsByLesson(lessonIdNumber);

        if (res.success && res.data) {
          setData(res.data);
          setItems(buildRunnerItems(res.data));
        } else if (!hasCachedData) {
          setError(res.error?.message || "Không tải được câu hỏi");
        }
      } catch (err) {
        console.error("Error loading questions:", err);
        if (!hasCachedData) {
          setError("Có lỗi xảy ra khi tải câu hỏi");
        }
      } finally {
        if (!hasCachedData) {
          setLoading(false);
        }
      }
    };

    loadQuestions();
  }, [lessonIdNumber]);

  useEffect(() => {
    if (!runnerStateReady || loading || isAdminPreview) {
      return;
    }

    if (!lessonIdNumber || Number.isNaN(lessonIdNumber)) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      writeRunnerState<PersistedLessonRunnerState>(
        getLessonRunnerStorageKey(lessonIdNumber),
        {
          version: 1,
          lessonId: lessonIdNumber,
          data,
          currentIndex,
          currentGroupQuestionIndex,
          pendingGroupQuestionIndex,
          answers,
          flaggedQuestions,
          eliminatedOptions,
          selectedMatchingAnswers,
          finished,
        },
        LESSON_RUNNER_STATE_TTL_MS,
      );
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [
    answers,
    currentGroupQuestionIndex,
    currentIndex,
    data,
    eliminatedOptions,
    finished,
    flaggedQuestions,
    lessonIdNumber,
    pendingGroupQuestionIndex,
    runnerStateReady,
    selectedMatchingAnswers,
    loading,
    isAdminPreview,
  ]);

  useEffect(() => {
    if (!items.length) {
      return;
    }

    if (currentIndex < 0) {
      setCurrentIndex(0);
      return;
    }

    if (currentIndex > items.length - 1) {
      setCurrentIndex(items.length - 1);
    }
  }, [currentIndex, items.length]);

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
            (a, b) =>
              (a.orderIndex ?? a.lessonNumber) -
                (b.orderIndex ?? b.lessonNumber) ||
              a.lessonNumber - b.lessonNumber ||
              a.lessonId - b.lessonId,
          ),
        );
      }
    };

    void loadSectionLessons();
  }, [sectionId]);

  useEffect(() => {
    const loadSectionMeta = async () => {
      if (!sectionId || Number.isNaN(sectionId)) {
        setUnitId(null);
        return;
      }

      const res = await getSection(sectionId);
      if (res.success && res.data?.unitId) {
        setUnitId(res.data.unitId);
        return;
      }

      setUnitId(null);
    };

    void loadSectionMeta();
  }, [sectionId]);

  useEffect(() => {
    if (!lessonIdNumber || sectionLessons.length === 0) {
      return;
    }

    const lessonExistsInPath = sectionLessons.some(
      (lesson) => lesson.lessonId === lessonIdNumber,
    );

    if (lessonExistsInPath) {
      return;
    }

    const fallbackLesson =
      sectionLessons.find((lesson) => lesson.current) ??
      sectionLessons.find((lesson) => lesson.unlocked) ??
      sectionLessons[0];

    if (fallbackLesson && fallbackLesson.lessonId !== lessonIdNumber) {
      navigate(`/lessons/${fallbackLesson.lessonId}`, { replace: true });
    }
  }, [lessonIdNumber, navigate, sectionLessons]);

  const currentItem = items[currentIndex];
  const currentGroup = currentItem?.group ?? null;
  const currentQuestions = currentItem?.questions ?? [];
  const isListeningItem = isListeningPassageGroup(currentGroup);
  const isReadingPassageItem = currentGroup?.groupType === "READING_PASSAGE";
  const isCompactPassageItem = isCompactPassageGroup(currentGroup);
  const activeQuestionIndex =
    currentQuestions.length === 0
      ? 0
      : Math.min(currentGroupQuestionIndex, currentQuestions.length - 1);
  const visibleQuestions = isCompactPassageItem
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
        item.questions.map(
          (question) => [question.id, question.questionType] as const,
        ),
      ),
    );
  }, [items]);

  const questionById = useMemo(() => {
    return new Map(
      items.flatMap((item) =>
        item.questions.map((question) => [question.id, question] as const),
      ),
    );
  }, [items]);

  const questionNavigatorItems = useMemo(() => {
    let label = 1;
    return items.flatMap((item, itemIndex) =>
      item.questions.map((question, questionIndex) => ({
        questionId: question.id,
        label: label++,
        itemIndex,
        questionIndex,
      })),
    );
  }, [items]);
  const compactPassageSegments = useMemo(
    () => parsePassageInlineSegments(currentGroup?.sharedContent),
    [currentGroup?.sharedContent],
  );
  const compactPassageBlankLabels = useMemo(
    () =>
      compactPassageSegments
        .filter(
          (segment): segment is Extract<PassageSegment, { type: "blank" }> =>
            segment.type === "blank",
        )
        .map((segment) => segment.label),
    [compactPassageSegments],
  );
  const compactPassageBlankLabelByQuestionId = useMemo(() => {
    const mapping = new Map<number, string>();
    currentQuestions.forEach((question, index) => {
      const label = compactPassageBlankLabels[index];
      if (label) {
        mapping.set(question.id, label);
      }
    });
    return mapping;
  }, [compactPassageBlankLabels, currentQuestions]);
  const compactPassageBlankCount = useMemo(
    () =>
      compactPassageSegments.filter((segment) => segment.type === "blank")
        .length,
    [compactPassageSegments],
  );
  const usesInlineCompactPassage =
    isCompactPassageItem &&
    compactPassageBlankCount > 0 &&
    compactPassageBlankCount === currentQuestions.length &&
    currentQuestions.every(
      (question) =>
        isMCQ(question.questionType) || isFillType(question.questionType),
    );

  const autoGradedSubmitted = useMemo(() => {
    return Object.entries(answers).filter(([questionId, state]) => {
      if (!state.submitted) return false;
      const type = questionTypeById.get(Number(questionId));
      return !!type && isAutoGradedType(type);
    });
  }, [answers, questionTypeById]);

  const autoGradedCorrectCount = useMemo(() => {
    return autoGradedSubmitted.filter(([, state]) => state.correct === true)
      .length;
  }, [autoGradedSubmitted]);

  const autoGradedSubmittedCount = autoGradedSubmitted.length;

  const totalSubmitted = useMemo(() => {
    return Object.values(answers).filter((a) => a.submitted).length;
  }, [answers]);
  const maxReachableNavigatorIndex = useMemo(() => {
    if (isAdminPreview) return questionNavigatorItems.length - 1;

    const firstIncompleteIndex = questionNavigatorItems.findIndex(
      (item) => !answers[item.questionId]?.submitted,
    );

    return firstIncompleteIndex === -1
      ? questionNavigatorItems.length - 1
      : firstIncompleteIndex;
  }, [answers, isAdminPreview, questionNavigatorItems]);
  const maxReachableGroupQuestionIndex = useMemo(() => {
    if (isAdminPreview) return currentQuestions.length - 1;

    const firstIncompleteIndex = currentQuestions.findIndex(
      (question) => !answers[question.id]?.submitted,
    );

    return firstIncompleteIndex === -1
      ? currentQuestions.length - 1
      : firstIncompleteIndex;
  }, [answers, currentQuestions, isAdminPreview]);

  const submittedPercent =
    totalQuestions > 0
      ? Math.round((totalSubmitted / totalQuestions) * 100)
      : 0;

  const progressPercent =
    items.length > 0
      ? Math.round(((currentIndex + 1) / items.length) * 100)
      : 0;

  const nextLesson = useMemo(() => {
    if (
      !sectionLessons.length ||
      !lessonIdNumber ||
      Number.isNaN(lessonIdNumber)
    ) {
      return null;
    }

    const currentLessonIndex = sectionLessons.findIndex(
      (lesson) => lesson.lessonId === lessonIdNumber,
    );

    if (
      currentLessonIndex < 0 ||
      currentLessonIndex >= sectionLessons.length - 1
    ) {
      return null;
    }

    return sectionLessons[currentLessonIndex + 1] ?? null;
  }, [lessonIdNumber, sectionLessons]);

  const nextLessonLabel = nextLesson?.reviewLesson
    ? "Next Review"
    : "Next Lesson";

  const buildLessonPath = (targetLessonId: number) =>
    isAdminPreview
      ? `/admin/content/preview/${targetLessonId}`
      : `/lessons/${targetLessonId}`;
  useEffect(() => {
    if (!items.length || hasRestoredRunnerPositionRef.current) return;

    hasRestoredRunnerPositionRef.current = true;
    setCurrentIndex(0);
    setCurrentGroupQuestionIndex(0);
    setPendingGroupQuestionIndex(null);
  }, [items.length]);

  const evaluatePreviewState = (
    question: QuestionDto,
    answer: UserAnswer,
  ): { submitted: boolean; correct: boolean | null } => {
    const hasAnswer =
      typeof answer === "string"
        ? answer.trim().length > 0
        : Array.isArray(answer)
          ? answer.length > 0
          : answer && typeof answer === "object"
            ? Object.keys(answer).length > 0
            : false;

    if (!hasAnswer) {
      return { submitted: false, correct: null };
    }

    if (isMCQ(question.questionType)) {
      const selected = normalizeText(String(answer));
      const correctOption = question.options.find((option) => option.isCorrect);
      const isCorrect = correctOption
        ? normalizeText(correctOption.optionKey) === selected ||
          normalizeText(correctOption.content) === selected
        : false;
      return { submitted: true, correct: isCorrect };
    }

    if (question.questionType === "TRUE_FALSE_NG") {
      const expected = getTrueFalseExpected(question);
      return {
        submitted: true,
        correct: normalizeText(String(answer)) === expected,
      };
    }

    if (isFillType(question.questionType)) {
      return {
        submitted: true,
        correct:
          normalizeText(String(answer)) ===
          normalizeText(String(question.correctAnswer ?? "")),
      };
    }

    if (question.questionType === "SENTENCE_REORDER") {
      const builtSentence = getSentenceReorderAnswerText(answer);
      return {
        submitted: builtSentence.length > 0,
        correct:
          normalizeText(builtSentence) ===
          normalizeText(String(question.correctAnswer ?? "")),
      };
    }

    if (question.questionType === "SENTENCE_REWRITE") {
      return {
        submitted: true,
        correct:
          normalizeText(String(answer)) ===
          normalizeText(String(question.correctAnswer ?? "")),
      };
    }

    if (question.questionType === "MATCHING") {
      const answerMap =
        answer && typeof answer === "object" && !Array.isArray(answer)
          ? answer
          : {};
      const expectedMap =
        parseJsonSafe<Record<string, string>>(question.correctAnswer || "") ||
        getMatchingData(question)?.answers ||
        null;

      if (!expectedMap) {
        return {
          submitted: Object.keys(answerMap).length > 0,
          correct: null,
        };
      }

      const leftItems = Object.keys(expectedMap);
      const isComplete = leftItems.every(
        (left) => String(answerMap[left] || "").trim().length > 0,
      );

      if (!isComplete) {
        return { submitted: false, correct: null };
      }

      return {
        submitted: true,
        correct: leftItems.every(
          (left) =>
            normalizeText(String(answerMap[left] || "")) ===
            normalizeText(String(expectedMap[left] || "")),
        ),
      };
    }

    if (
      question.questionType === "PRONUNCIATION" ||
      question.questionType === "TOPIC_SPEAKING"
    ) {
      const transcript = typeof answer === "string" ? answer.trim() : "";
      if (!transcript) {
        return { submitted: false, correct: null };
      }

      return {
        submitted: true,
        ...evaluatePronunciationAttempt(question, transcript),
      };
    }

    return { submitted: true, correct: null };
  };

  const setAnswer = (questionId: number, answer: UserAnswer) => {
    setSubmitApiError(null);
    const question = questionById.get(questionId);

    if (typeof answer === "string") {
      setEliminatedOptions((prev) => {
        const current = prev[questionId];
        if (!current?.includes(answer)) {
          return prev;
        }

        return {
          ...prev,
          [questionId]: current.filter((item) => item !== answer),
        };
      });
    }

    if (isAdminPreview && question) {
      const preview = evaluatePreviewState(question, answer);
      setAnswers((prev) => ({
        ...prev,
        [questionId]: {
          answer,
          submitted: preview.submitted,
          correct: preview.correct,
          feedback: null,
          score: null,
        },
      }));
      return;
    }

    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        answer,
        submitted: false,
        correct: null,
        feedback: null,
        score: prev[questionId]?.score ?? null,
        attemptCount: prev[questionId]?.attemptCount ?? 0,
        maxAttempts: prev[questionId]?.maxAttempts ?? 3,
        expectedAnswer: prev[questionId]?.expectedAnswer ?? null,
        recognizedText:
          typeof answer === "string"
            ? answer.trim()
            : (prev[questionId]?.recognizedText ?? null),
        similarity: null,
        issueSummary: null,
      },
    }));
  };

  const setEssayImageFile = (questionId: number, file: File | null) => {
    setEssayAttachments((prev) => ({
      ...prev,
      [questionId]: {
        file,
      },
    }));
  };

  const getQuestionAnswer = (questionId: number) => answers[questionId];

  const isQuestionFlagged = (questionId: number) =>
    Boolean(flaggedQuestions[questionId]);

  const toggleQuestionFlag = (questionId: number) => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const isOptionEliminated = (questionId: number, optionKey: string) =>
    Boolean(eliminatedOptions[questionId]?.includes(optionKey));

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

  const getFillChoices = (
    question: QuestionDto,
    group: QuestionGroupDto | null,
  ) => {
    const optionChoices = (question.options || [])
      .map((option) => option.content?.trim())
      .filter((value): value is string => Boolean(value));

    const questionData = getQuestionData(question);
    const dataChoices = Array.isArray(questionData?.options)
      ? questionData.options
          .map((value) => String(value).trim())
          .filter(Boolean)
      : [];

    const wordBankChoices = getWordBank(group)
      .map((value: unknown) => String(value).trim())
      .filter(Boolean);

    const merged = [...optionChoices, ...dataChoices, ...wordBankChoices];
    return Array.from(new Set(merged)).slice(0, 8);
  };

  const renderInlineFillSentence = (
    question: QuestionDto,
    currentAnswer: AnswerState[number] | undefined,
    choices: string[],
    isAnswerLocked: boolean,
  ) => {
    const parts = splitFillSentence(question.content);
    if (!parts || choices.length === 0) return null;

    const selectedValue =
      typeof currentAnswer?.answer === "string" ? currentAnswer.answer : "";

    return (
      <div className="rounded-2xl border border-[#dbeafe] bg-[#f8fbff] p-4">
        <p className="mb-3 text-sm font-bold text-[#155ca5]">
          Chọn đáp án để điền vào chỗ trống
        </p>
        <div className="question-text-unified text-[#1e2e51] leading-relaxed">
          {parts.map((part, index) => {
            if (!isFillBlankToken(part)) {
              return (
                <span
                  key={`fill-text-${index}`}
                  className="whitespace-pre-wrap"
                >
                  {renderFormattedInlineText(part)}
                </span>
              );
            }

            return (
              <span
                key={`fill-select-${index}`}
                className="mx-1 inline-flex min-w-[210px] items-center rounded-2xl border border-[#bfd8ff] bg-white shadow-[0_8px_24px_rgba(21,92,165,0.08)]"
              >
                <select
                  disabled={isAnswerLocked}
                  value={selectedValue}
                  onChange={(event) =>
                    setAnswer(question.id, event.target.value)
                  }
                  className="w-full appearance-none bg-transparent px-4 py-3 pr-10 text-base font-bold text-[#155ca5] outline-none"
                >
                  <option value="">Chọn đáp án</option>
                  {choices.map((choice) => (
                    <option key={`${question.id}-${choice}`} value={choice}>
                      {choice}
                    </option>
                  ))}
                </select>
                <ChevronDown className="mr-3 h-4 w-4 shrink-0 text-[#155ca5]" />
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  const getReorderWords = (question: QuestionDto) => {
    if (question.questionType !== "SENTENCE_REORDER") {
      return [];
    }

    const parseSlashSeparatedWords = (value?: string | null) => {
      if (!value?.includes("/")) return [];

      return value
        .split("/")
        .map((word) => word.trim())
        .filter(Boolean);
    };

    const questionDataWords = parseSlashSeparatedWords(question.questionData);
    if (questionDataWords.length > 0) {
      return questionDataWords;
    }

    const questionData = getQuestionData(question);
    if (Array.isArray(questionData?.words)) {
      return questionData.words;
    }

    const contentLineWithWords =
      question.content
        ?.replace(/\r\n/g, "\n")
        .split("\n")
        .map((line) => line.trim())
        .find((line) => line.includes("/")) ?? "";
    const contentWords = parseSlashSeparatedWords(contentLineWithWords);
    if (contentWords.length > 0) {
      return contentWords;
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

    const parsedCorrectAnswer = normalizeMatchingPayload(
      question.correctAnswer,
    );
    if (parsedCorrectAnswer) {
      return parsedCorrectAnswer;
    }

    return normalizeMatchingPayload(currentGroup?.groupData);
  };

  const getQuestionHint = (question: QuestionDto) => {
    if (!question.hint?.trim()) {
      return null;
    }

    if (question.hint?.trim()) {
      return question.hint.trim();
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
        return "Bấm ghi âm để hệ thống nghe và đối chiếu transcript với câu mẫu. Mỗi câu có tối đa 3 lượt thử.";
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
    speechManualStopRef.current = true;
    try {
      speechRecognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    speechRecognitionRef.current = null;
    speechRestartAttemptsRef.current = 0;
    speechTranscriptRef.current = "";
    speechPreviewRef.current = "";
    setIsListening(false);
    setSpeechPreview("");
    setSpeechSessionQuestionId(null);
  };

  const resetSpeechAnswerState = (questionId: number) => {
    setAnswers((prev) => {
      const current = prev[questionId];
      if (!current) {
        return prev;
      }

      return {
        ...prev,
        [questionId]: {
          ...current,
          answer: "",
          submitted: false,
          correct: null,
          feedback: null,
          score: current.score ?? null,
          expectedAnswer: null,
          recognizedText: null,
          similarity: null,
          issueSummary: null,
        },
      };
    });
  };

  const finalizeSpeechAttempt = async (question: QuestionDto) => {
    const latestAnswer = answersRef.current[question.id];
    const transcript =
      typeof latestAnswer?.answer === "string"
        ? latestAnswer.answer.trim()
        : "";

    if (!transcript || latestAnswer?.submitted) {
      return;
    }

    await submitQuestion(question);
  };

  const handleSpeechCheck = async (question: QuestionDto) => {
    if (isListening && speechSessionQuestionId === question.id) {
      stopSpeechCapture();
      return;
    }

    await finalizeSpeechAttempt(question);
  };

  const getSpeechErrorMessage = (error?: string) => {
    switch (error) {
      case "network":
        return "Kết nối nhận diện giọng nói bị gián đoạn. Nếu hệ thống đã nghe được transcript thì mình vẫn tự chấm tiếp.";
      case "not-allowed":
      case "service-not-allowed":
        return "Trình duyệt đang chặn quyền micro. Hãy bật quyền micro rồi thử lại.";
      case "no-speech":
        return "Không nghe thấy giọng nói rõ ràng. Hãy thử nói lại gần micro hơn.";
      case "audio-capture":
        return "Không lấy được âm thanh từ micro. Hãy kiểm tra thiết bị mic.";
      default:
        return error || "Không thể nhận diện giọng nói.";
    }
  };

  const startSpeechCapture = (
    question: QuestionDto,
    options?: { preserveExistingTranscript?: boolean },
  ) => {
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
    speechManualStopRef.current = false;
    speechRestartAttemptsRef.current = 0;
    if (!options?.preserveExistingTranscript) {
      speechTranscriptRef.current = "";
      speechPreviewRef.current = "";
    }
    // clear any existing recognition quietly (do not mark manual stop)
    try {
      speechRecognitionRef.current?.stop();
    } catch {}
    speechRecognitionRef.current = null;
    setIsListening(false);
    setSpeechPreview("");
    setSpeechSessionQuestionId(null);
    if (!options?.preserveExistingTranscript) {
      resetSpeechAnswerState(question.id);
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";

      for (let i = 0; i < event.results.length; i += 1) {
        const transcript = event.results[i][0]?.transcript ?? "";

        if (event.results[i].isFinal) {
          finalText += `${transcript} `;
        } else {
          interimText += `${transcript} `;
        }
      }

      if (interimText.trim()) {
        const normalizedInterimText = interimText.trim();
        speechPreviewRef.current = normalizedInterimText;
        setSpeechPreview(normalizedInterimText);
      }

      const normalizedFinalText = finalText.replace(/\s+/g, " ").trim();
      if (normalizedFinalText) {
        speechTranscriptRef.current = normalizedFinalText;
        speechPreviewRef.current = "";
        setAnswer(question.id, normalizedFinalText);
        setSpeechPreview("");
      }
    };

    recognition.onerror = (event) => {
      const err = event?.error;
      const hasCapturedSpeech = Boolean(
        speechTranscriptRef.current.trim() || speechPreviewRef.current.trim(),
      );

      if (err === "aborted") {
        if (!speechManualStopRef.current) {
          return;
        }
        setSpeechError(null);
        return;
      }

      // let onend handle quiet restart for temporary no-speech interruptions
      if (!speechManualStopRef.current && err === "no-speech") {
        return;
      }

      if (!speechManualStopRef.current && err === "network" && hasCapturedSpeech) {
        setSpeechError(null);
        setIsListening(false);
        setSpeechSessionQuestionId(null);
        speechRecognitionRef.current = null;
        void finalizeSpeechAttempt(question);
        return;
      }

      setSpeechError(getSpeechErrorMessage(err));

      setIsListening(false);
      setSpeechSessionQuestionId(null);
      speechRecognitionRef.current = null;
      void finalizeSpeechAttempt(question);
    };

    recognition.onend = () => {
      const hasCapturedSpeech = Boolean(
        speechTranscriptRef.current.trim() || speechPreviewRef.current.trim(),
      );

      // If user didn't manually stop and we haven't retried too many times, try restart
      const shouldRestart =
        !speechManualStopRef.current &&
        !hasCapturedSpeech &&
        speechRestartAttemptsRef.current < 2;
      if (shouldRestart) {
        speechRestartAttemptsRef.current += 1;
        setTimeout(() => {
          try {
            // create a fresh recognition instance via recursive start
            startSpeechCapture(question, { preserveExistingTranscript: true });
          } catch {
            speechRecognitionRef.current = null;
            void finalizeSpeechAttempt(question);
          }
        }, 300);
        return;
      }

      setIsListening(false);
      setSpeechPreview("");
      setSpeechSessionQuestionId(null);
      speechRecognitionRef.current = null;
      void finalizeSpeechAttempt(question);
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
    const visibleQuestionIds = new Set(
      currentQuestions.map((question) => question.id),
    );
    if (
      isListening &&
      speechSessionQuestionId &&
      !visibleQuestionIds.has(speechSessionQuestionId)
    ) {
      stopSpeechCapture();
    }
  }, [currentQuestions, isListening, speechSessionQuestionId]);

  useEffect(() => {
    if (pendingGroupQuestionIndex != null) {
      setCurrentGroupQuestionIndex(pendingGroupQuestionIndex);
      setPendingGroupQuestionIndex(null);
      return;
    }

    setCurrentGroupQuestionIndex(0);
  }, [currentIndex, pendingGroupQuestionIndex]);

  useEffect(() => {
    if (isCompactPassageItem || typeof window === "undefined") return;

    const questionTop = questionViewportRef.current?.getBoundingClientRect().top;

    if (questionTop == null || questionTop >= 96) return;

    questionViewportRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [activeQuestionIndex, currentIndex, isCompactPassageItem]);

  const jumpToQuestion = (itemIndex: number, questionIndex: number) => {
    setPendingGroupQuestionIndex(questionIndex);
    setCurrentIndex(itemIndex);
  };

  const getCompactPassageChoices = (
    question: QuestionDto,
    fallbackChoices: string[],
  ) => {
    const optionChoices = question.options
      .map((option) => option.content?.trim())
      .filter((value): value is string => Boolean(value));

    const fillChoices = getFillChoices(question, currentGroup);
    return Array.from(
      new Set([...optionChoices, ...fillChoices, ...fallbackChoices]),
    );
  };

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
    setSelectedMatchingAnswers((prev) => {
      const nextSelected = { ...prev };
      delete nextSelected[questionId];
      return nextSelected;
    });
  };

  const selectMatchingAnswer = (questionId: number, rightItem: string) => {
    setSelectedMatchingAnswers((prev) => ({
      ...prev,
      [questionId]: prev[questionId] === rightItem ? "" : rightItem,
    }));
  };

  const applySelectedMatchingAnswer = (
    questionId: number,
    leftItem: string,
  ) => {
    const selectedRight = selectedMatchingAnswers[questionId]?.trim();
    if (!selectedRight) return;

    updateMatchingAnswer(questionId, leftItem, selectedRight);
  };

  const removeMatchingAnswer = (questionId: number, leftItem: string) => {
    const current = answers[questionId]?.answer;
    if (!current || typeof current !== "object" || Array.isArray(current))
      return;

    const next = { ...current };
    delete next[leftItem];
    setAnswer(questionId, next);
  };

  const handleSubmitOnEnter = (
    event: KeyboardEvent<HTMLInputElement>,
    question: QuestionDto,
  ) => {
    if (event.key !== "Enter") return;
    if (event.nativeEvent.isComposing) return;
    if (!canSubmitQuestion(question) || submittingCurrent) return;

    event.preventDefault();
    void submitQuestion(question);
  };

  const appendWordBankWord = (questionId: number, word: string) => {
    const current = answers[questionId]?.answer;
    const text = typeof current === "string" ? current : "";
    const next = text.trim() ? `${text} ${word}` : word;
    setAnswer(questionId, next);
  };

  const appendReorderWord = (
    questionId: number,
    word: string,
    index: number,
  ) => {
    const current = answers[questionId]?.answer;
    const selected = Array.isArray(current) ? current : [];
    const token = `${index}|||${word}`;

    if (selected.includes(token)) return;

    setAnswer(questionId, [...selected, token]);
  };

  const removeReorderWord = (questionId: number, tokenIndex: number) => {
    const current = answers[questionId]?.answer;
    const selected = Array.isArray(current) ? current : [];
    if (tokenIndex < 0 || tokenIndex >= selected.length) return;

    setAnswer(
      questionId,
      selected.filter((_, index) => index !== tokenIndex),
    );
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
    return getSentenceReorderAnswerText(current ?? "");
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
    let expectedAnswer: string | null = null;
    let recognizedText: string | null = null;
    let similarity: number | null = null;
    let issueSummary: string | null = null;

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
      const builtSentence = getSentenceReorderAnswerText(saved.answer);
      const expected = normalizeText(String(question.correctAnswer ?? ""));
      correct = normalizeText(builtSentence) === expected;
    } else if (question.questionType === "SENTENCE_REWRITE") {
      const typed = normalizeText(String(saved.answer));
      const expected = normalizeText(String(question.correctAnswer ?? ""));
      correct = typed === expected;
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
    } else if (
      question.questionType === "PRONUNCIATION" ||
      question.questionType === "TOPIC_SPEAKING"
    ) {
      const transcript =
        typeof saved.answer === "string" ? saved.answer.trim() : "";
      const pronunciationResult = evaluatePronunciationAttempt(
        question,
        transcript,
      );
      correct = pronunciationResult.correct;
      feedback = pronunciationResult.feedback;
      expectedAnswer = pronunciationResult.expectedAnswer;
      recognizedText = pronunciationResult.recognizedText;
      similarity = pronunciationResult.similarity;
      issueSummary = pronunciationResult.issueSummary;
    } else if (isManualType(question.questionType)) {
      correct = null;
    }

    const answerText = toAnswerText(saved.answer, question);

    if (question.questionType === "ESSAY_WRITING") {
      const essayImageFile = essayAttachments[question.id]?.file ?? null;
      const res = essayImageFile
        ? await submitEssayWithImage({
            questionId: question.id,
            answerText,
            imageFile: essayImageFile,
          })
        : await submitEssay({
            questionId: question.id,
            answerText,
          });

      if (res.success && res.data) {
        correct = null;
        feedback = res.data.feedback;
        score = res.data.score;
        submitted = true;
      } else if (!res.success) {
        setSubmitApiError(res.error?.message || "Could not submit essay.");
      }
    } else if (
      question.questionType === "PRONUNCIATION" ||
      question.questionType === "TOPIC_SPEAKING"
    ) {
      submitted = true;
    } else {
      const res = await submitQuestionHistory({
        questionId: question.id,
        answer_text: answerText,
      });

      if (res.success && res.data) {
        submitted = true;
      } else if (!res.success) {
        setSubmitApiError(res.error?.message || "Could not submit answer.");
      }
    }

    return {
      submitted,
      correct,
      feedback,
      score,
      expectedAnswer,
      recognizedText,
      similarity,
      issueSummary,
    };
  };

  const submitQuestion = async (question: QuestionDto) => {
    const saved = answers[question.id];
    if (!saved) return;

    setSubmittingCurrent(true);
    setSubmitApiError(null);

    try {
      if (isAdminPreview) {
        const preview = evaluatePreviewState(question, saved.answer);
        setAnswers((prev) => ({
          ...prev,
          [question.id]: {
            ...prev[question.id],
            submitted: preview.submitted,
            correct: preview.correct,
            feedback: null,
            score: null,
          },
        }));
        return;
      }

      let correct: boolean | null = null;
      let feedback: string | null = null;
      let score: number | null = null;
      let submitted = false;
      let expectedAnswer: string | null = null;
      let recognizedText: string | null = null;
      let similarity: number | null = null;
      let issueSummary: string | null = null;
      const previousAttempts = saved.attemptCount ?? 0;
      const maxAttempts = saved.maxAttempts ?? 3;

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
        const builtSentence = getSentenceReorderAnswerText(saved.answer);
        const expected = normalizeText(String(question.correctAnswer ?? ""));
        correct = normalizeText(builtSentence) === expected;
      } else if (question.questionType === "SENTENCE_REWRITE") {
        const typed = normalizeText(String(saved.answer));
        const expected = normalizeText(String(question.correctAnswer ?? ""));
        correct = typed === expected;
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
      } else if (
        question.questionType === "PRONUNCIATION" ||
        question.questionType === "TOPIC_SPEAKING"
      ) {
        const transcript =
          typeof saved.answer === "string" ? saved.answer.trim() : "";
        const pronunciationResult = evaluatePronunciationAttempt(
          question,
          transcript,
        );
        const nextAttempts = previousAttempts + 1;

        correct = pronunciationResult.correct;
        feedback = pronunciationResult.feedback;
        expectedAnswer = pronunciationResult.expectedAnswer;
        recognizedText = pronunciationResult.recognizedText;
        similarity = pronunciationResult.similarity;
        issueSummary = pronunciationResult.issueSummary;

        if (correct) {
          submitted = true;
        } else if (nextAttempts >= maxAttempts) {
          submitted = true;
          feedback = `${pronunciationResult.feedback} Bạn đã dùng hết ${maxAttempts} lượt thử.`;
        } else {
          submitted = false;
          feedback = `${pronunciationResult.feedback} Còn ${maxAttempts - nextAttempts} lượt thử nữa.`;
        }
      } else if (isManualType(question.questionType)) {
        correct = null;
      }

      const answerText = toAnswerText(saved.answer, question);

      if (question.questionType === "ESSAY_WRITING") {
        const essayImageFile = essayAttachments[question.id]?.file ?? null;
        const res = essayImageFile
          ? await submitEssayWithImage({
              questionId: question.id,
              answerText,
              imageFile: essayImageFile,
            })
          : await submitEssay({
              questionId: question.id,
              answerText,
            });

        if (res.success && res.data) {
          correct = null;
          feedback = res.data.feedback;
          score = res.data.score;
          submitted = true;
        } else if (!res.success) {
          setSubmitApiError(res.error?.message || "Could not submit essay.");
        }
      } else if (
        question.questionType === "PRONUNCIATION" ||
        question.questionType === "TOPIC_SPEAKING"
      ) {
        // Pronunciation is evaluated locally from the recognized transcript.
      } else {
        const res = await submitQuestionHistory({
          questionId: question.id,
          answer_text: answerText,
        });

        if (res.success && res.data) {
          correct = isManualType(question.questionType)
            ? null
            : res.data.correct;
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
          attemptCount:
            question.questionType === "PRONUNCIATION" ||
            question.questionType === "TOPIC_SPEAKING"
              ? previousAttempts + 1
              : (prev[question.id]?.attemptCount ?? 0),
          maxAttempts:
            question.questionType === "PRONUNCIATION" ||
            question.questionType === "TOPIC_SPEAKING"
              ? maxAttempts
              : prev[question.id]?.maxAttempts,
          expectedAnswer,
          recognizedText,
          similarity,
          issueSummary,
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
      if (isAdminPreview) {
        setCompleteApiError(null);
        setLessonReward(null);
        setFinished(true);
        return;
      }

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

          void refreshCurrentUser(false);
        } else if (!res.success) {
          setCompleteApiError(
            res.error?.message ||
              "Không lưu được trạng thái hoàn thành lesson.",
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

  const renderQuestionHint = (question: QuestionDto) => {
    const hint = getQuestionHint(question);
    const showQuestionData = false;

    if (!hint) return null;

    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 space-y-2">
        {hint && (
          <div>
            <span className="font-bold">Gợi ý:</span>
            <div className="mt-2">{renderTextWithBreaks(hint)}</div>
          </div>
        )}
        {showQuestionData && (
          <p>
            <span className="font-bold">Question data:</span>{" "}
            {question.questionData}
          </p>
        )}
      </div>
    );
  };

  const getLocalizedQuestionHint = (question: QuestionDto) => {
    if (question.hint?.trim()) {
      return question.hint.trim();
    }

    return null;

    switch (question.questionType) {
      case "MATCHING":
        return copy(
          "Match each item on the left with the correct answer on the right. Each answer should usually be used once.",
          "Nối từng mục bên trái với đúng đáp án bên phải. Mỗi đáp án thường chỉ dùng một lần.",
        );
      case "TRUE_FALSE_NG":
        return copy(
          "Use the shared passage to choose TRUE, FALSE, or NOT GIVEN. Do not guess beyond the information in the text.",
          "Dựa vào đoạn chung để chọn TRUE, FALSE hoặc NOT GIVEN. Không đoán ngoài dữ kiện có trong bài.",
        );
      case "WORD_BANK_FILL":
        return copy(
          "Read the whole sentence first, then choose the best word from the word bank to fill the blank.",
          "Đọc toàn câu trước, sau đó chọn từ phù hợp nhất từ word bank để điền vào chỗ trống.",
        );
      case "SENTENCE_REORDER":
        return copy(
          "Arrange the words in the correct order to form a complete sentence.",
          "Ghép các từ theo thứ tự tạo thành câu hoàn chỉnh.",
        );
      case "SENTENCE_REWRITE":
        return copy(
          "Rewrite the sentence while keeping the original meaning.",
          "Viết lại câu nhưng giữ nguyên nghĩa chính của câu gốc.",
        );
      case "ESSAY_WRITING":
        return copy(
          "Answer clearly and cover the main idea. Simple but correct writing is better than overcomplicated writing.",
          "Trả lời đủ ý, rõ ràng. Câu đơn giản nhưng đúng vẫn tốt hơn viết quá rối.",
        );
      case "PRONUNCIATION":
      case "TOPIC_SPEAKING":
        return copy(
          "Tap record so the system can capture your speech and compare it with the expected answer. Each question allows up to 3 attempts.",
          "Bấm ghi âm để hệ thống nghe và đối chiếu với câu mẫu. Mỗi câu có tối đa 3 lượt thử.",
        );
      default:
        return copy(
          "Read the instruction carefully and choose the best answer before submitting.",
          "Đọc kỹ yêu cầu và chọn đáp án phù hợp nhất trước khi nộp.",
        );
    }
  };

  const renderQuestionHintLocalized = (question: QuestionDto) => {
    const hint = getLocalizedQuestionHint(question);
    const showQuestionData = false;

    if (!hint && !showQuestionData) return null;

    return (
      <div className="space-y-2">
        {hint && (
          <div className="rounded-2xl border border-[#ffe2a8] bg-[#fff8e8] px-4 py-3 text-sm text-[#7a4b00]">
            <span className="font-black">{copy("Hint:", "Gợi ý:")}</span> {hint}
          </div>
        )}

        {showQuestionData && (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
            <span className="font-bold">Question data:</span>{" "}
            {question.questionData}
          </div>
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
    const isAnswerLocked = currentAnswer?.submitted && !isAdminPreview;
    const wordBank = getWordBank(group);
    const reorderWords = getReorderWords(question);
    const matchingData = getMatchingData(question);
    const fillChoices = getFillChoices(question, group);
    const inlineFillSentence = renderInlineFillSentence(
      question,
      currentAnswer,
      fillChoices,
      isAnswerLocked,
    );

    if (isMCQ(question.questionType)) {
      return (
                <div className="space-y-2.5">
          {question.options.map((option) => {
            const selected = currentAnswer?.answer === option.optionKey;
            const submitted = currentAnswer?.submitted;
            const isCorrectOption = option.isCorrect;
            const eliminated = isOptionEliminated(
              question.id,
              option.optionKey,
            );

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
            } else if (eliminated) {
              extraClass = "border-slate-200 bg-slate-50";
            }

            return (
              <div
                key={`${option.id}-${option.optionKey}-${option.content}`}
                className="grid items-stretch"
              >
                <button
                  disabled={isAnswerLocked}
                  onClick={() => setAnswer(question.id, option.optionKey)}
                  className={`text-left rounded-2xl border-2 transition-all ${compact ? "p-2.5" : "p-3 md:p-3.5"} ${extraClass}`}
                >
                  <div
                    className={`${compact ? "flex items-center gap-2" : "flex items-center gap-2.5"}`}
                  >
                    <div
                      className={`${compact ? "h-7 w-7 text-xs" : "h-8 w-8 text-xs"} shrink-0 rounded-2xl border flex items-center justify-center font-black ${selected ? "border-[#155ca5] bg-[#155ca5] text-white" : "border-slate-200 bg-white text-[#1e2e51]"}`}
                    >
                      {option.optionKey}
                    </div>
                    <div
                      className={`${compact ? "text-sm font-semibold" : "text-sm font-semibold"} ${eliminated && !selected ? "text-slate-400 line-through" : "text-[#1e2e51]"}`}
                    >
                      {renderFormattedInlineText(option.content)}
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      );
    }

    if (question.questionType === "TRUE_FALSE_NG") {
      const values = ["true", "false", "not given"];

      return (
        <div
          className={`grid gap-3 ${compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3 gap-4"}`}
        >
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
                disabled={isAnswerLocked}
                onClick={() => setAnswer(question.id, value)}
                className={`rounded-2xl border-2 font-bold uppercase transition-all ${compact ? "p-2.5 text-xs" : "p-3 text-xs md:p-3.5 md:text-sm"} ${extraClass}`}
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
      if (inlineFillSentence) {
        return inlineFillSentence;
      }

      return (
        <div className="space-y-3">
          <input
            type="text"
            disabled={isAnswerLocked}
            value={
              typeof currentAnswer?.answer === "string"
                ? currentAnswer.answer
                : ""
            }
            onChange={(e) => setAnswer(question.id, e.target.value)}
            onKeyDown={(e) => handleSubmitOnEnter(e, question)}
            placeholder="Nhập câu trả lời..."
            className="w-full rounded-2xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#155ca5]"
          />
        </div>
      );
    }

    if (question.questionType === "WORD_BANK_FILL") {
      if (inlineFillSentence) {
        return inlineFillSentence;
      }

      return (
        <div className="space-y-4">
          {false && (
            <div className="rounded-[1.5rem] border border-[#dbeafe] bg-[#f8fbff] p-4">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#155ca5]">
                Speak And Auto Check
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Hệ thống sẽ tự chấm ngay sau khi bạn dừng nói. Bạn có tối đa 3
                lượt thử.
              </p>
            </div>
          )}
          {wordBank.length > 0 && (
            <div className="rounded-2xl border border-[#dbeafe] bg-[#f8fbff] p-3">
              <p className="mb-2.5 text-xs font-bold text-[#155ca5] sm:text-sm">Word Bank</p>
              <div className="flex flex-wrap gap-2">
                {wordBank.map((word: string) => (
                  <button
                    key={word}
                    type="button"
                    disabled={isAnswerLocked}
                    onClick={() => appendWordBankWord(question.id, word)}
                    className="rounded-full border border-[#bfd8ff] bg-white px-3 py-1.5 text-xs font-semibold text-[#155ca5] hover:bg-[#eef6ff] disabled:opacity-60 sm:text-sm"
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>
          )}

          <input
            type="text"
            disabled={isAnswerLocked}
            value={
              typeof currentAnswer?.answer === "string"
                ? currentAnswer.answer
                : ""
            }
            onChange={(e) => setAnswer(question.id, e.target.value)}
            onKeyDown={(e) => handleSubmitOnEnter(e, question)}
            placeholder="Điền từ hoặc bấm từ trong Word Bank..."
            className="w-full rounded-2xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#155ca5]"
          />
        </div>
      );
    }

    if (question.questionType === "SENTENCE_REORDER") {
      const typedSentence =
        typeof currentAnswer?.answer === "string"
          ? currentAnswer.answer
          : getDisplayedReorderSentence(question.id);

      return (
        <div className="space-y-4">
          {isAdminPreview && reorderWords.length === 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              This item is using free-text sentence input because no reorder
              word list was provided in `questionData`.
            </div>
          )}

          <div className="rounded-3xl border border-[#dbeafe] bg-[#f8fbff] p-3.5 shadow-sm">
            <p className="mb-2.5 text-xs font-black uppercase tracking-[0.18em] text-[#155ca5] sm:text-sm">
              {copy("Rewrite the full sentence", "Viet lai ca cau")}
            </p>
            <textarea
              disabled={isAnswerLocked}
              value={typedSentence}
              onChange={(e) => setAnswer(question.id, e.target.value)}
              placeholder={copy(
                "Write the complete sentence here...",
                "Nhap cau hoan chinh vao day...",
              )}
              rows={3}
              className="min-h-[92px] w-full resize-none rounded-2xl border border-dashed border-[#9bc2ff] bg-white px-3.5 py-2.5 text-sm text-[#1e2e51] outline-none transition focus:border-[#155ca5] focus:ring-2 focus:ring-[#155ca5]/10 disabled:cursor-not-allowed disabled:bg-slate-50"
            />

            {!isAnswerLocked && typedSentence && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setAnswer(question.id, "")}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  {copy("Reset", "Dat lai")}
                </button>
              </div>
            )}
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
          {leftItems.length > 0 && rightItems.length > 0 ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#dbeafe] bg-[#f8fbff] p-4">
                <p className="mb-3 text-sm font-bold text-[#155ca5]">
                  Chọn thẻ nghĩa bên trên, sau đó bấm vào ô bên dưới để ghép.
                </p>

                {availableRightItems.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableRightItems.map((rightItem) => (
                      <button
                        key={`matching-card-${rightItem}`}
                        type="button"
                        disabled={isAnswerLocked}
                        onClick={() =>
                          selectMatchingAnswer(question.id, rightItem)
                        }
                        className={`rounded-xl border px-3 py-1 text-xs font-semibold transition-all disabled:opacity-60 sm:text-sm ${
                          selectedMatchingAnswers[question.id] === rightItem
                            ? "border-[#155ca5] bg-[#eef6ff] text-[#155ca5]"
                            : "border-[#bfd8ff] bg-white text-[#155ca5] hover:bg-[#eef6ff]"
                        }`}
                      >
                        {renderFormattedInlineText(rightItem)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Tất cả thẻ đã được ghép.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                {leftItems.map((leftItem) => {
                  const selectedValue = answerMap[leftItem] || "";

                  return (
                    <div
                      key={leftItem}
                      className="grid grid-cols-1 gap-2 items-center rounded-2xl border border-gray-200 p-3 md:grid-cols-[1fr_320px]"
                    >
                      <div className="font-semibold text-[#1e2e51]">
                        {renderFormattedInlineText(leftItem)}
                      </div>

                      <div
                        onClick={() => {
                          if (isAnswerLocked) return;
                          applySelectedMatchingAnswer(question.id, leftItem);
                        }}
                        className={`min-h-[42px] rounded-xl border-2 border-dashed px-3 py-1.5 flex items-center justify-between gap-2 ${
                          selectedValue
                            ? "border-[#bfd8ff] bg-[#f8fbff]"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {selectedValue ? (
                          <span className="text-[#155ca5] font-semibold">
                            {renderFormattedInlineText(selectedValue)}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">
                            Bấm để điền thẻ đang chọn vào đây
                          </span>
                        )}

                        {selectedValue && !isAnswerLocked && (
                          <button
                            type="button"
                            onClick={() =>
                              removeMatchingAnswer(question.id, leftItem)
                            }
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
                {copy("Submitted:", "Da nop:")} {totalSubmitted}/
                {totalQuestions} {copy("question(s)", "cau")}
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
          disabled={isAnswerLocked}
          value={
            typeof currentAnswer?.answer === "string"
              ? currentAnswer.answer
              : ""
          }
          onChange={(e) => setAnswer(question.id, e.target.value)}
          placeholder="Viết lại câu ở đây..."
          className="w-full rounded-2xl border border-gray-300 px-5 py-4 outline-none focus:border-[#155ca5] resize-none"
        />
      );
    }

    if (question.questionType === "ESSAY_WRITING") {
      const attachedImage = essayAttachments[question.id]?.file ?? null;
      return (
        <div className="space-y-4">
          <textarea
            rows={8}
            disabled={isAnswerLocked}
            value={
              typeof currentAnswer?.answer === "string"
                ? currentAnswer.answer
                : ""
            }
            onChange={(e) => setAnswer(question.id, e.target.value)}
            placeholder="Write your essay here..."
            className="w-full rounded-2xl border border-gray-300 px-5 py-4 outline-none focus:border-[#155ca5] resize-y"
          />

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-black uppercase tracking-[0.18em] text-[#155ca5]">
              Essay Image
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Attach a photo of your handwritten or printed essay if you want
              the AI to review it together with your typed answer.
            </p>
            <input
              type="file"
              accept="image/*"
              disabled={isAnswerLocked}
              onChange={(e) =>
                setEssayImageFile(question.id, e.target.files?.[0] || null)
              }
              className="mt-3 block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-[#155ca5] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-[#0f4c88]"
            />
            <p className="mt-2 text-sm text-slate-500">
              {attachedImage
                ? `Selected image: ${attachedImage.name}`
                : "No image selected. Text-only essay scoring still works."}
            </p>
          </div>
        </div>
      );
    }

    if (
      question.questionType === "PRONUNCIATION" ||
      question.questionType === "TOPIC_SPEAKING"
    ) {
      const speakingActive =
        isListening && speechSessionQuestionId === question.id;
      const transcript =
        typeof currentAnswer?.answer === "string"
          ? currentAnswer.answer.trim()
          : "";
      const attemptCount = currentAnswer?.attemptCount ?? 0;
      const maxAttempts = currentAnswer?.maxAttempts ?? 3;
      const canCheckTranscript = false;
      return (
        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-[#dbeafe] bg-[#f8fbff] p-4">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#155ca5]">
              Speak And Auto Check
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Hệ thống sẽ tự chấm ngay sau khi bạn dừng nói. Bạn có tối đa 3
              lượt thử.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-[#155ca5]/10 px-3 py-1.5 font-semibold text-[#155ca5]">
              Lượt thử: {attemptCount}/{maxAttempts}
            </span>
            {question.correctAnswer && (
              <span className="font-medium text-slate-600">
                Câu mẫu:{" "}
                <span className="font-semibold text-[#1e2e51]">
                  {question.correctAnswer}
                </span>
              </span>
            )}
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              {!speakingActive ? (
                <button
                  type="button"
                  disabled={
                    isAnswerLocked ||
                    !speechSupported ||
                    attemptCount >= maxAttempts
                  }
                  onClick={() => startSpeechCapture(question)}
                  className="flex-1 inline-flex items-center justify-center gap-3 rounded-[1.25rem] border border-[#bfd8ff] bg-white px-4 py-4 text-base font-black text-[#155ca5] hover:bg-[#eef6ff] disabled:opacity-50"
                >
                  <Mic className="w-4 h-4" />
                  Bắt đầu nói
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isAnswerLocked}
                  onClick={stopSpeechCapture}
                  className="flex-1 inline-flex items-center justify-center gap-3 rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-4 text-base font-black text-red-600 hover:bg-red-100 disabled:opacity-50"
                >
                  <MicOff className="w-4 h-4" />
                  Dừng nghe
                </button>
              )}

              <button
                type="button"
                onClick={() => void handleSpeechCheck(question)}
                disabled={
                  isAnswerLocked ||
                  submittingCurrent ||
                  (!speechPreview &&
                    !(currentAnswer?.recognizedText || transcript))
                }
                title="Kiểm tra transcript"
                className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${
                  submittingCurrent
                    ? "bg-gray-200 text-gray-700"
                    : "border border-[#155ca5] bg-white text-[#155ca5] hover:bg-[#eef6ff]"
                } disabled:opacity-50`}
              >
                {copy("Check", "Kiem tra")}
              </button>
            </div>

            {speakingActive && (
              <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                {copy("Listening...", "Dang nghe...")}
              </span>
            )}

            {canCheckTranscript && (
              <button
                type="button"
                onClick={() => void handleSpeechCheck(question)}
                disabled={submittingCurrent}
                className="inline-flex items-center gap-2 rounded-xl border border-[#155ca5] bg-[#155ca5] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0f4c88] disabled:opacity-50"
              >
                {submittingCurrent
                  ? copy("Submitting...", "Dang nop...")
                  : copy("Submit answer", "Nop cau tra loi")}
              </button>
            )}
          </div>

          {speechPreview && (
            <p className="text-sm text-[#155ca5]">
              {copy("Listening:", "Dang nghe:")}{" "}
              <span className="font-semibold">{speechPreview}</span>
            </p>
          )}

          {speechError && (
            <p className="text-sm text-red-600">
              {copy("Voice error:", "Loi voice:")} {speechError}
            </p>
          )}

          {(transcript || currentAnswer?.recognizedText) && (
            <p className="text-sm text-slate-600">
              Hệ thống nghe được:{" "}
              <span className="font-semibold text-[#1e2e51]">
                {currentAnswer?.recognizedText || transcript}
              </span>
            </p>
          )}
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

  const renderFeedbackLegacy = (question: QuestionDto) => {
    const currentAnswer = getQuestionAnswer(question.id);
    if (!currentAnswer?.submitted) return null;

    if (isAdminPreview) {
      if (currentAnswer.correct === true) {
        return (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
            Đúng rồi.
          </div>
        );
      }

      if (currentAnswer.correct === false) {
        return (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            Sai rồi.
          </div>
        );
      }

      return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
          Câu này chưa tự chấm được ngay.
        </div>
      );
    }

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

            {false && !currentAnswer.correct && question.correctAnswer && (
              <p className="text-sm font-semibold text-gray-600">
                Đáp án đúng: {question.correctAnswer}
              </p>
            )}

            {question.questionType === "MATCHING" &&
              currentAnswer.correct === null && (
                <p className="text-sm text-gray-600">
                  Matching chỉ tự chấm khi backend trả về `correctAnswer` hoặc
                  mapping đáp án đầy đủ.
                </p>
              )}

            {isManualQuestion && (
              <p className="text-sm text-gray-600">
                Dạng này đã được gửi đi, hệ thống sẽ dùng nội dung bạn nộp để
                đánh giá thay vì chấm đúng/sai ngay.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderFeedback = (question: QuestionDto) => {
    const currentAnswer = getQuestionAnswer(question.id);
    if (!currentAnswer) return null;

    const isPronunciationQuestion =
      question.questionType === "PRONUNCIATION" ||
      question.questionType === "TOPIC_SPEAKING";

    if (!currentAnswer.submitted) {
      if (
        isPronunciationQuestion &&
        (currentAnswer.attemptCount ?? 0) > 0 &&
        currentAnswer.feedback
      ) {
        return (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-6 w-6 rounded-full bg-amber-400" />
              <div className="space-y-2 text-sm text-amber-900">
                <p className="font-black">Chưa đạt, hãy thử lại</p>
                <p>{currentAnswer.feedback}</p>
                {currentAnswer.recognizedText && (
                  <p>
                    <span className="font-semibold">Hệ thống nghe được:</span>{" "}
                    {currentAnswer.recognizedText}
                  </p>
                )}
                {currentAnswer.expectedAnswer && (
                  <p>
                    <span className="font-semibold">Câu mẫu:</span>{" "}
                    {currentAnswer.expectedAnswer}
                  </p>
                )}
                {typeof currentAnswer.similarity === "number" && (
                  <p>
                    <span className="font-semibold">Độ khớp:</span>{" "}
                    {Math.round(currentAnswer.similarity * 100)}%
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      }

      return null;
    }

    if (isAdminPreview) {
      return (
        <div
          className={`rounded-2xl border p-4 text-sm font-bold ${
            currentAnswer.correct === true
              ? "border-green-200 bg-green-50 text-green-700"
              : currentAnswer.correct === false
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-slate-200 bg-slate-50 text-slate-600"
          }`}
        >
          {currentAnswer.correct === true
            ? "Đúng rồi."
            : currentAnswer.correct === false
              ? "Sai rồi."
              : "Câu này chưa tự chấm được ngay."}
        </div>
      );
    }

    const isUngraded = currentAnswer.correct === null;
    const isManualQuestion = isManualType(question.questionType);
    const selectedOption =
      isMCQ(question.questionType) && typeof currentAnswer.answer === "string"
        ? question.options.find(
            (option) =>
              normalizeText(option.optionKey) ===
                normalizeText(currentAnswer.answer as string) ||
              normalizeText(option.content) ===
                normalizeText(currentAnswer.answer as string),
          )
        : null;
    const correctOption = isMCQ(question.questionType)
      ? question.options.find((option) => option.isCorrect)
      : null;
    const userAnswerText =
      question.questionType === "SENTENCE_REORDER"
        ? getDisplayedReorderSentence(question.id)
        : toAnswerText(currentAnswer.answer, question);

    return (
      <div
        className={`rounded-2xl border p-3.5 ${
          isUngraded
            ? "border-amber-200 bg-amber-50"
            : currentAnswer.correct
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
        }`}
      >
        <div className="flex items-start gap-3">
          {isUngraded ? (
            <div className="mt-0.5 h-6 w-6 rounded-full bg-amber-400" />
          ) : currentAnswer.correct ? (
            <CheckCircle2 className="mt-0.5 h-6 w-6 text-green-600" />
          ) : (
            <XCircle className="mt-0.5 h-6 w-6 text-red-600" />
          )}

          <div className="space-y-2">
            <p
              className={`text-sm font-black ${
                isUngraded
                  ? "text-amber-800"
                  : currentAnswer.correct
                    ? "text-green-700"
                    : "text-red-700"
              }`}
            >
              {isUngraded
                ? isManualQuestion
                  ? "Đã nộp, chờ đánh giá"
                  : question.questionType === "MATCHING"
                    ? "Đã nộp, chưa có đáp án chuẩn để tự chấm"
                    : "Đã nộp"
                : currentAnswer.correct
                  ? "Chính xác!"
                  : "Chưa đúng"}
            </p>

            {currentAnswer.issueSummary && (
              <p className="text-sm font-medium text-gray-700">
                {currentAnswer.issueSummary}
              </p>
            )}

            {!isManualQuestion &&
              !isPronunciationQuestion &&
              question.questionType !== "MATCHING" &&
              userAnswerText && (
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Bạn trả lời:</span>{" "}
                  {userAnswerText}
                </p>
              )}

            {isMCQ(question.questionType) && selectedOption && (
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Bạn chọn:</span>{" "}
                {selectedOption.optionKey}.{" "}
                {renderFormattedInlineText(selectedOption.content)}
              </p>
            )}

            {question.questionType === "TRUE_FALSE_NG" &&
              typeof currentAnswer.answer === "string" && (
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Bạn chọn:</span>{" "}
                  {currentAnswer.answer.toUpperCase()}
                </p>
              )}

            {question.questionType === "MATCHING" &&
              currentAnswer.answer &&
              typeof currentAnswer.answer === "object" &&
              !Array.isArray(currentAnswer.answer) && (
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Ghép của bạn:</span>{" "}
                  {Object.entries(currentAnswer.answer)
                    .map(([left, right]) => `${left} -> ${right}`)
                    .join(" | ")}
                </p>
              )}

            {isPronunciationQuestion && currentAnswer.recognizedText && (
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Hệ thống nghe được:</span>{" "}
                {currentAnswer.recognizedText}
              </p>
            )}

            {isPronunciationQuestion && currentAnswer.expectedAnswer && (
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Câu mẫu:</span>{" "}
                {currentAnswer.expectedAnswer}
              </p>
            )}

            {isPronunciationQuestion &&
              typeof currentAnswer.similarity === "number" && (
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Độ khớp:</span>{" "}
                  {Math.round(currentAnswer.similarity * 100)}%
                </p>
              )}

            {typeof currentAnswer.score === "number" && (
              <p className="text-sm font-semibold text-[#155ca5]">
                Essay score: {currentAnswer.score}
              </p>
            )}

            {currentAnswer.feedback && (
              <p className="text-sm text-gray-700">
                Nhận xét: {currentAnswer.feedback}
              </p>
            )}

            {!currentAnswer.correct && correctOption && (
              <p className="text-sm font-semibold text-gray-700">
                Đáp án đúng: {correctOption.optionKey}. {correctOption.content}
              </p>
            )}

            {!currentAnswer.correct &&
              !correctOption &&
              question.correctAnswer &&
              !isManualQuestion && (
                <p className="text-sm font-semibold text-gray-700">
                  Đáp án đúng: {question.correctAnswer}
                </p>
              )}

            {question.questionType === "MATCHING" &&
              currentAnswer.correct === null && (
                <p className="text-sm text-gray-600">
                  Matching chỉ tự chấm khi backend trả về `correctAnswer` hoặc
                  mapping đáp án đầy đủ.
                </p>
              )}

            {isManualQuestion && (
              <p className="text-sm text-gray-600">
                Dạng này đã được gửi đi, hệ thống sẽ dùng nội dung bạn nộp để
                đánh giá thay vì chấm đúng/sai ngay.
              </p>
            )}

            {!isManualQuestion && question.explanation && (
              <div className="rounded-xl border border-white/70 bg-white/70 p-3 text-sm text-gray-700">
                <span className="font-semibold">Giải thích:</span>{" "}
                {question.explanation}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderFeedbackLocalized = (question: QuestionDto) => {
    const currentAnswer = getQuestionAnswer(question.id);
    if (!currentAnswer?.submitted) return null;

    const selectedOption =
      typeof currentAnswer.answer === "string"
        ? question.options.find(
            (option) =>
              normalizeText(option.optionKey) ===
                normalizeText(currentAnswer.answer as string) ||
              normalizeText(option.content) ===
                normalizeText(currentAnswer.answer as string),
          )
        : null;
    const correctOption =
      question.options.find((option) => option.isCorrect) ?? null;
    const isPronunciationQuestion =
      question.questionType === "PRONUNCIATION" ||
      question.questionType === "TOPIC_SPEAKING";
    const isUngraded =
      currentAnswer.correct === null &&
      !(
        isPronunciationQuestion &&
        typeof currentAnswer.similarity === "number" &&
        typeof currentAnswer.expectedAnswer === "string"
      );
    const isManualQuestion = isManualType(question.questionType);
    const userAnswerText =
      question.questionType === "SENTENCE_REORDER"
        ? getDisplayedReorderSentence(question.id)
        : toAnswerText(currentAnswer.answer, question);

    return (
      <div
        className={`rounded-2xl border p-5 ${
          isUngraded
            ? "border-amber-200 bg-amber-50"
            : currentAnswer.correct
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
        }`}
      >
        <div className="flex items-start gap-3">
          {isUngraded ? (
            <div className="mt-0.5 h-6 w-6 rounded-full bg-amber-400" />
          ) : currentAnswer.correct ? (
            <CheckCircle2 className="mt-0.5 h-6 w-6 text-green-600" />
          ) : (
            <XCircle className="mt-0.5 h-6 w-6 text-red-600" />
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
                ? isManualQuestion
                  ? copy(
                      "Submitted, waiting for evaluation",
                      "Đã nộp, chờ đánh giá",
                    )
                  : question.questionType === "MATCHING"
                    ? copy(
                        "Submitted, but there is not enough answer data to auto-grade yet",
                        "Đã nộp, nhưng chưa có đủ dữ liệu đáp án để tự chấm",
                      )
                    : copy("Submitted", "Đã nộp")
                : currentAnswer.correct
                  ? copy("Correct!", "Chính xác!")
                  : copy("Not correct yet", "Chưa đúng")}
            </p>

            {currentAnswer.issueSummary && (
              <p className="text-sm font-medium text-gray-700">
                {currentAnswer.issueSummary}
              </p>
            )}

            {!isManualQuestion &&
              !isPronunciationQuestion &&
              question.questionType !== "MATCHING" &&
              !isMCQ(question.questionType) &&
              question.questionType !== "TRUE_FALSE_NG" &&
              userAnswerText && (
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">
                    {copy("You answered:", "Bạn trả lời:")}
                  </span>{" "}
                  {userAnswerText}
                </p>
              )}

            {isMCQ(question.questionType) && selectedOption && (
              <p className="text-sm text-gray-700">
                <span className="font-semibold">
                  {copy("You chose:", "Bạn chọn:")}
                </span>{" "}
                {selectedOption.optionKey}. {selectedOption.content}
              </p>
            )}

            {question.questionType === "TRUE_FALSE_NG" &&
              typeof currentAnswer.answer === "string" && (
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">
                    {copy("You chose:", "Bạn chọn:")}
                  </span>{" "}
                  {currentAnswer.answer.toUpperCase()}
                </p>
              )}

            {question.questionType === "MATCHING" &&
              currentAnswer.answer &&
              typeof currentAnswer.answer === "object" &&
              !Array.isArray(currentAnswer.answer) && (
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">
                    {copy("Your matches:", "Ghép của bạn:")}
                  </span>{" "}
                  {Object.entries(currentAnswer.answer)
                    .map(([left, right]) => `${left} -> ${right}`)
                    .join(" | ")}
                </p>
              )}

            {isPronunciationQuestion && currentAnswer.recognizedText && (
              <p className="text-sm text-gray-700">
                <span className="font-semibold">
                  {copy("The system heard:", "Hệ thống nghe được:")}
                </span>{" "}
                {currentAnswer.recognizedText}
              </p>
            )}

            {isPronunciationQuestion && currentAnswer.expectedAnswer && (
              <p className="text-sm text-gray-700">
                <span className="font-semibold">
                  {copy("Expected answer:", "Câu mẫu:")}
                </span>{" "}
                {currentAnswer.expectedAnswer}
              </p>
            )}

            {isPronunciationQuestion &&
              typeof currentAnswer.similarity === "number" && (
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">
                    {copy("Similarity:", "Độ khớp:")}
                  </span>{" "}
                  {Math.round(currentAnswer.similarity * 100)}%
                </p>
              )}

            {typeof currentAnswer.score === "number" && (
              <p className="text-sm font-semibold text-[#155ca5]">
                {copy("Essay score:", "Điểm bài viết:")} {currentAnswer.score}
              </p>
            )}

            {currentAnswer.feedback && (
              <p className="text-sm text-gray-700">
                {copy("Feedback:", "Nhận xét:")} {currentAnswer.feedback}
              </p>
            )}

            {!currentAnswer.correct && correctOption && (
              <p className="text-sm font-semibold text-gray-700">
                {copy("Correct answer:", "Dap an dung:")}{" "}
                {correctOption.optionKey}.{" "}
                {renderFormattedInlineText(correctOption.content)}
              </p>
            )}

            {!currentAnswer.correct &&
              !correctOption &&
              question.correctAnswer &&
              !isManualQuestion && (
                <p className="text-sm font-semibold text-gray-700">
                  {copy("Correct answer:", "Dap an dung:")}{" "}
                  {question.correctAnswer}
                </p>
              )}

            {question.questionType === "MATCHING" &&
              currentAnswer.correct === null && (
                <p className="text-sm text-gray-600">
                  {copy(
                    "Matching can only be auto-graded when the backend returns a complete answer mapping.",
                    "Matching chỉ tự chấm khi backend trả về mapping đáp án đầy đủ.",
                  )}
                </p>
              )}

            {isManualQuestion && (
              <p className="text-sm text-gray-600">
                {copy(
                  "This answer has been submitted. The system will evaluate your written content instead of grading it instantly as right or wrong.",
                  "Dạng này đã được gửi đi, hệ thống sẽ dùng nội dung bạn nộp để đánh giá thay vì chấm đúng/sai ngay.",
                )}
              </p>
            )}

            {!isManualQuestion && question.explanation && (
              <div className="rounded-xl border border-white/70 bg-white/70 p-3 text-sm text-gray-700">
                <span className="font-semibold">
                  {copy("Explanation:", "Giải thích:")}
                </span>{" "}
                {renderFormattedInlineText(question.explanation)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const isCurrentItemComplete = currentQuestions.every(
    (question) => answers[question.id]?.submitted,
  );

  const unansweredCurrentQuestionLabels = currentQuestions
    .filter(
      (question) =>
        !answers[question.id]?.submitted && !canSubmitQuestion(question),
    )
    .map(
      (question) =>
        compactPassageBlankLabelByQuestionId.get(question.id) ??
        String(
          currentQuestions.findIndex((item) => item.id === question.id) + 1,
        ),
    );

  const readyToSubmitCurrentQuestionLabels = currentQuestions
    .filter(
      (question) =>
        !answers[question.id]?.submitted && canSubmitQuestion(question),
    )
    .map(
      (question) =>
        compactPassageBlankLabelByQuestionId.get(question.id) ??
        String(
          currentQuestions.findIndex((item) => item.id === question.id) + 1,
        ),
    );

  const canGoNext = isAdminPreview ? true : isCurrentItemComplete;

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-10 min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-[#155ca5]" />
          <p className="text-gray-600 font-medium">
            {copy("Loading questions...", "Dang tai cau hoi...")}
          </p>
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
            {copy("Back", "Quay lai")}
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
            {copy(
              "This lesson does not have any questions yet",
              "Lesson nay chua co cau hoi nao",
            )}
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
              {copy("Lesson completed", "Hoan thanh lesson")}
            </h1>
            <p className="text-gray-600 mt-3 text-lg">
              {copy("Auto-grade:", "Tu cham:")} {copy("correct", "dung")}{" "}
              {autoGradedCorrectCount}/{autoGradedSubmittedCount || 0}{" "}
              {copy("question(s)", "cau")}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Đã nộp: {totalSubmitted}/{totalQuestions} câu
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {copy(
                "Pass condition: accuracy from 80% or above.",
                "Dieu kien qua bai: do chinh xac tu 80% tro len.",
              )}
            </p>

            {lessonReward && (
              <p className="text-sm text-[#1e2e51] mt-2 font-semibold">
                {copy("Reward:", "Thuong:")} +{lessonReward.coinsEarned} coins,
                +{lessonReward.expEarned} EXP
              </p>
            )}

            {lessonReward && (
              <p className="text-sm text-gray-600 mt-1">
                {copy("Lesson progress:", "Tien do lesson:")}{" "}
                {lessonReward.progressPercent}% |{" "}
                {copy("Total EXP:", "Tong EXP:")} {lessonReward.currentExp}
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
                if (lessonIdNumber && Number.isFinite(lessonIdNumber)) {
                  clearRunnerState(getLessonRunnerStorageKey(lessonIdNumber));
                }
                setFinished(false);
                setCurrentIndex(0);
                setAnswers({});
                setSubmitApiError(null);
                setCompleteApiError(null);
                setLessonReward(null);
              }}
              className="px-6 py-3 rounded-xl bg-[#155ca5] text-white font-bold hover:bg-[#0f4c88]"
            >
              {copy("Retry", "Lam lai")}
            </button>

            {sectionId ? (
              <Link
                to={unitId ? `/units/${unitId}/sections` : `/sections/${sectionId}/lessons`}
                className="px-6 py-3 rounded-xl border border-gray-300 font-bold text-[#1e2e51] hover:bg-gray-50"
              >
                {copy("Back to section", "Ve section")}
              </Link>
            ) : (
              <Link
                to="/"
                className="px-6 py-3 rounded-xl border border-gray-300 font-bold text-[#1e2e51] hover:bg-gray-50"
              >
                {copy("Back to dashboard", "Ve dashboard")}
              </Link>
            )}

            {sectionId && (
              <button
                onClick={() => {
                  if (nextLesson) {
                    navigate(buildLessonPath(nextLesson.lessonId));
                    return;
                  }
                  navigate(
                    isAdminPreview
                      ? "/admin/content"
                      : `/sections/${sectionId}/lessons`,
                  );
                }}
                className="px-6 py-3 rounded-xl bg-[#27ae60] text-white font-bold hover:bg-[#1f8b4d]"
              >
                {nextLesson
                  ? copy(
                      nextLessonLabel,
                      nextLesson?.reviewLesson
                        ? "Review tiep theo"
                        : "Lesson tiep theo",
                    )
                  : copy("Back to dashboard", "Ve dashboard")}
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  if (!currentItem || currentQuestions.length === 0) return null;

  return (
    <main
      className={`${isListeningItem || usesInlineCompactPassage ? "max-w-7xl" : "max-w-6xl"} mx-auto px-4 md:px-6 py-6 md:py-8 pb-24`}
    >
      <section className="mb-6">
        {isAdminPreview && (
          <div className="mb-4 rounded-2xl border border-[#cfe3ff] bg-[#f4f8ff] px-4 py-3 text-sm text-[#155ca5]">
            <span className="font-bold">Admin Preview:</span> Try the lesson as
            a learner. Progress is not saved and grading is disabled.
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            if (isAdminPreview) {
              navigate("/admin/content");
              return;
            }
            navigate(-1);
          }}
          className="inline-flex items-center gap-2 text-[#155ca5] font-bold hover:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          {copy("Back", "Quay lai")}
        </button>

        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <span className="inline-block px-3 py-1 rounded-full bg-[#73aaf9]/20 text-[#155ca5] text-xs font-bold uppercase tracking-wider">
              Lesson {lessonId}
            </span>
            <span className="text-sm font-bold text-gray-500">
              {copy("Screen", "Man")} {currentIndex + 1}/{items.length}
            </span>
          </div>

          <div className="sticky top-3 z-30 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#155ca5]">
                  {copy("Question Navigator", "Dieu huong cau hoi")}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {copy(
                    "This navigator stays visible so you can always see the current question.",
                    "Thanh nay se bam theo man hinh de luon thay cau hien tai.",
                  )}
                </p>
              </div>
              <div className="rounded-full bg-[#155ca5]/10 px-2.5 py-1 text-xs font-bold text-[#155ca5] shadow-sm">
                {copy("Question", "Cau")}{" "}
                {questionNavigatorItems.findIndex(
                  (item) =>
                    item.itemIndex === currentIndex &&
                    item.questionIndex === activeQuestionIndex,
                ) + 1}
                /{totalQuestions}
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {questionNavigatorItems.map((item, itemOrderIndex) => {
                const state = answers[item.questionId];
                const isActive =
                  item.itemIndex === currentIndex &&
                  item.questionIndex === activeQuestionIndex;
                const canJumpFromBoard =
                  itemOrderIndex <= maxReachableNavigatorIndex;
                const flagged = isQuestionFlagged(item.questionId);
                const displayLabel =
                  item.itemIndex === currentIndex && usesInlineCompactPassage
                    ? (compactPassageBlankLabelByQuestionId.get(
                        item.questionId,
                      ) ?? item.label)
                    : item.label;

                const statusClass = isActive
                  ? "border-amber-300 bg-amber-100 text-amber-900 shadow-[0_8px_18px_rgba(245,158,11,0.22)]"
                  : !state?.submitted
                    ? flagged
                      ? "border-amber-300 bg-amber-50 text-amber-700"
                      : "border-slate-300 bg-white text-slate-600"
                    : state.correct === true
                      ? "border-green-300 bg-green-50 text-green-700"
                      : state.correct === false
                        ? "border-red-300 bg-red-50 text-red-700"
                        : "border-amber-300 bg-amber-50 text-amber-700";

                return (
                  <button
                    key={`nav-question-${item.questionId}-${item.label}`}
                    type="button"
                    onClick={() => {
                      if (!canJumpFromBoard) return;
                      jumpToQuestion(item.itemIndex, item.questionIndex);
                    }}
                    disabled={!canJumpFromBoard}
                    className={`flex h-7 min-w-7 items-center justify-center rounded-full border px-1.5 text-[11px] font-black transition sm:h-8 sm:min-w-8 sm:text-xs ${statusClass} ${isActive ? "ring-2 ring-amber-200" : ""} ${canJumpFromBoard ? "cursor-pointer" : "cursor-default"}`}
                  >
                    {displayLabel}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section
        className={
          isCompactPassageItem && !usesInlineCompactPassage
            ? "grid gap-4 lg:grid-cols-[minmax(420px,1.02fr)_minmax(0,0.98fr)] lg:items-start"
            : "space-y-4"
        }
      >
        {isCompactPassageItem && !usesInlineCompactPassage ? (
          <div className="lg:max-h-[calc(100vh-16rem)] lg:overflow-y-auto lg:pr-2">
            <GroupSharedContent
              group={currentGroup}
              hideSharedContent={usesInlineCompactPassage}
            />
          </div>
        ) : !usesInlineCompactPassage ? (
          <GroupSharedContent
            group={currentGroup}
            hideSharedContent={usesInlineCompactPassage}
          />
        ) : null}

        <div
          className={
            isCompactPassageItem
              ? `space-y-4 lg:max-h-[calc(100vh-16rem)] lg:overflow-y-auto ${usesInlineCompactPassage ? "" : "lg:pl-2"}`
              : "space-y-4"
          }
        >
          {currentGroup &&
            currentQuestions.length > 1 &&
            !isCompactPassageItem && (
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#155ca5]">
                      {copy("Group Questions", "Nhom cau hoi")}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {copy(
                        "Move through questions in the same screen to avoid a long scroll.",
                        "Chuyen tung cau trong cung mot man de do cuon dai.",
                      )}
                    </p>
                  </div>
                  <div className="rounded-full bg-[#155ca5]/10 px-2.5 py-1 text-xs font-bold text-[#155ca5]">
                    {copy("Question", "Cau")} {activeQuestionIndex + 1}/
                    {currentQuestions.length}
                  </div>
                </div>

                <div className="mt-2.5 flex flex-wrap gap-1">
                  {currentQuestions.map((question, index) => {
                    const state = getQuestionAnswer(question.id);
                    const active = index === activeQuestionIndex;
                    const canOpenQuestion =
                      index <= maxReachableGroupQuestionIndex;
                    const buttonClass = active
                      ? "border-amber-300 bg-amber-100 text-amber-900 shadow-[0_8px_18px_rgba(245,158,11,0.22)]"
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
                        onClick={() => {
                          if (!canOpenQuestion) return;
                          setCurrentGroupQuestionIndex(index);
                        }}
                        disabled={!canOpenQuestion}
                        className={`flex min-w-7 items-center justify-center rounded-full border px-2 py-1 text-[11px] font-black transition sm:min-w-8 sm:px-2.5 sm:py-1.5 sm:text-xs ${buttonClass} ${!canOpenQuestion ? "cursor-not-allowed opacity-45" : ""}`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          {usesInlineCompactPassage &&
            (() => {
              let blankCursor = 0;

              return (
                <div className="rounded-3xl bg-white p-3.5 shadow-sm md:p-4">
                  <div className="rounded-2xl border border-[#dbeafe] bg-[#f8fbff] p-3.5">
                    <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-[#155ca5]">
                      {copy("Complete The Passage", "Hoan thanh doan van")}
                    </p>
                    <div className="question-text-unified leading-relaxed text-[#1e2e51]">
                      {compactPassageSegments.map((segment, index) => {
                        if (segment.type === "text") {
                          return (
                            <span
                              key={`passage-text-${index}`}
                              className="whitespace-pre-wrap"
                            >
                              {renderFormattedInlineText(segment.value)}
                            </span>
                          );
                        }

                        const mappedQuestion = currentQuestions[blankCursor];
                        blankCursor += 1;

                        if (!mappedQuestion) {
                          return (
                            <span
                              key={`passage-blank-missing-${index}`}
                              className="mx-1 font-semibold text-red-500"
                            >
                              ({segment.label})
                            </span>
                          );
                        }

                        const answerState = getQuestionAnswer(
                          mappedQuestion.id,
                        );
                        const selectedValue =
                          typeof answerState?.answer === "string"
                            ? answerState.answer
                            : "";
                        const isLocked =
                          answerState?.submitted && !isAdminPreview;
                        const dropdownChoices = getCompactPassageChoices(
                          mappedQuestion,
                          segment.choices,
                        );
                        const dropdownClass =
                          answerState?.submitted && answerState.correct === true
                            ? "border-green-300 bg-green-50 text-green-700"
                            : answerState?.submitted &&
                                answerState.correct === false
                              ? "border-red-300 bg-red-50 text-red-700"
                              : "border-[#bfd8ff] bg-white text-[#155ca5]";

                        return (
                          <span
                            key={`passage-blank-${mappedQuestion.id}`}
                            className="mx-1 inline-flex items-center gap-2 align-middle"
                          >
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-sm font-black text-slate-600">
                              ({segment.label})
                            </span>
                            <span
                              className={`inline-flex min-w-[180px] items-center rounded-2xl border shadow-[0_8px_24px_rgba(21,92,165,0.08)] sm:min-w-[210px] ${dropdownClass}`}
                            >
                              <select
                                disabled={isLocked}
                                value={selectedValue}
                                onChange={(event) =>
                                  setAnswer(
                                    mappedQuestion.id,
                                    event.target.value,
                                  )
                                }
                                className="w-full appearance-none bg-transparent px-3 py-2.5 pr-9 text-xs font-bold outline-none sm:px-4 sm:py-3 sm:text-sm"
                              >
                                <option value="">
                                  {copy("Blank", "Cho trong")} {segment.label}
                                </option>
                                {dropdownChoices.map((choice) => (
                                  <option
                                    key={`${mappedQuestion.id}-${choice}`}
                                    value={choice}
                                  >
                                    {choice}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="mr-3 h-4 w-4 shrink-0 text-current" />
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-2.5 space-y-2">
                    {currentQuestions.map((question, index) => {
                      const questionAnswer = getQuestionAnswer(question.id);
                      if (!questionAnswer?.submitted) return null;

                      return (
                        <div
                          key={`compact-feedback-${question.id}`}
                          className={`rounded-2xl border px-3.5 py-3 ${
                            questionAnswer.correct === true
                              ? "border-green-200 bg-green-50"
                              : questionAnswer.correct === false
                                ? "border-red-200 bg-red-50"
                                : "border-amber-200 bg-amber-50"
                          }`}
                        >
                          <p className="text-sm font-bold text-[#1e2e51]">
                            {copy("Blank", "Cho trong")}{" "}
                            {compactPassageBlankLabelByQuestionId.get(
                              question.id,
                            ) ?? index + 1}
                          </p>
                          {questionAnswer.correct === false && (
                            <p className="mt-1 text-sm text-gray-700">
                              {copy("Correct answer:", "Dap an dung:")}{" "}
                              <span className="font-semibold">
                                {question.options.find(
                                  (option) => option.isCorrect,
                                )?.content || question.correctAnswer}
                              </span>
                            </p>
                          )}
                          {question.explanation && (
                            <p className="mt-1 text-sm text-gray-600">
                              {question.explanation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

          {!usesInlineCompactPassage &&
            visibleQuestions.map((question) => {
              const questionIndex = currentQuestions.findIndex(
                (item) => item.id === question.id,
              );
              const questionAnswer = getQuestionAnswer(question.id);
              const flagged = isQuestionFlagged(question.id);
              const mediaImageUrl = getQuestionImageUrl(currentGroup, question);
              const mediaAudioUrl = isListeningItem
                ? question.audioUrl &&
                  question.audioUrl !== currentGroup?.audioUrl
                  ? getQuestionAudioUrl(currentGroup, question)
                  : null
                : getQuestionAudioUrl(currentGroup, question);

              return (
                <div
                  key={question.id}
                  ref={questionIndex === activeQuestionIndex ? questionViewportRef : null}
                  className={`bg-white shadow-sm ${isCompactPassageItem ? "rounded-2xl p-3 space-y-3" : "rounded-3xl p-3 md:p-3.5 space-y-3"} ${isReadingPassageItem ? "border border-[#e3eefc]" : ""}`}
                >
                  <div
                    className={isCompactPassageItem ? "space-y-1.5" : "space-y-2"}
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3 flex-wrap">
                        {(isAdminPreview ||
                          question.questionType !== "MATCHING") && (
                          <div
                            className={`inline-flex items-center justify-center rounded-full bg-[#155ca5] px-2 font-black text-white ${isCompactPassageItem ? "h-7 min-w-7 text-[11px]" : "h-7 min-w-7 text-[11px] sm:h-8 sm:min-w-8 sm:text-xs"}`}
                          >
                            {questionIndex + 1}
                          </div>
                        )}
                        {isAdminPreview && (
                          <div className="inline-block rounded-full bg-[#f3f7ff] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#155ca5]">
                            {getQuestionTypeLabel(question.questionType)}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleQuestionFlag(question.id)}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold transition sm:gap-1.5 sm:text-xs ${
                          flagged
                            ? "border-amber-300 bg-amber-50 text-amber-700"
                            : "border-slate-200 bg-white text-slate-500 hover:border-[#155ca5]/35 hover:text-[#155ca5]"
                        }`}
                      >
                        {flagged ? (
                          <BookmarkCheck className="h-3.5 w-3.5" />
                        ) : (
                          <Bookmark className="h-3.5 w-3.5" />
                        )}
                        {flagged
                          ? copy("Flagged", "Da danh dau")
                          : copy("Flag for review", "Danh dau de xem lai")}
                      </button>

                      <div className="text-xs font-semibold text-gray-500">
                        {questionAnswer?.submitted
                          ? questionAnswer.correct === null
                            ? copy("Submitted", "Da nop")
                            : questionAnswer.correct
                              ? copy("Correct", "Dung")
                              : copy("Incorrect", "Sai")
                          : copy("Not submitted", "Chua nop")}
                      </div>
                    </div>

                    {question.instruction && (
                      <div
                        className={`${isCompactPassageItem ? "text-xs" : "text-sm"} font-medium text-gray-500`}
                      >
                        {renderTextWithBreaks(question.instruction)}
                      </div>
                    )}

                    {question.content?.trim() && (
                      <div className="question-text-unified text-[0.95rem] text-[#1e2e51] sm:text-[0.98rem]">
                        {renderTextWithBreaks(question.content)}
                      </div>
                    )}
                  </div>

                  <MediaBlock
                    imageUrl={mediaImageUrl}
                    audioUrl={mediaAudioUrl}
                  />

                  {renderQuestionHintLocalized(question)}

                  {renderAnswerArea(
                    question,
                    currentGroup,
                    isCompactPassageItem,
                  )}

                  {renderFeedbackLocalized(question)}

                  {!isListeningItem && !isCompactPassageItem && (
                    <div
                      className={`flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100 ${isCompactPassageItem ? "pt-2.5" : "pt-3"}`}
                    >
                      {currentGroup && !isCompactPassageItem ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setCurrentGroupQuestionIndex((prev) =>
                                Math.max(prev - 1, 0),
                              )
                            }
                            disabled={activeQuestionIndex === 0}
                            className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 transition hover:border-[#155ca5] hover:text-[#155ca5] disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
                          >
                            {copy("Previous question", "Cau truoc")}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCurrentGroupQuestionIndex((prev) =>
                                Math.min(prev + 1, currentQuestions.length - 1),
                              )
                            }
                            disabled={
                              activeQuestionIndex >=
                                currentQuestions.length - 1 ||
                              activeQuestionIndex + 1 >
                                maxReachableGroupQuestionIndex
                            }
                            className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 transition hover:border-[#155ca5] hover:text-[#155ca5] disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
                          >
                            {copy("Next question", "Cau sau")}
                          </button>
                        </div>
                      ) : (
                        <div />
                      )}

                      {!isAdminPreview &&
                        !questionAnswer?.submitted &&
                        !isSpeechType(question.questionType) && (
                          <button
                            onClick={() => void submitQuestion(question)}
                            disabled={
                              !canSubmitQuestion(question) || submittingCurrent
                            }
                            className={`rounded-xl bg-[#155ca5] text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0f4c88] ${isCompactPassageItem ? "px-4 py-2.5 text-sm" : "px-5 py-2.5 text-sm"}`}
                          >
                            {submittingCurrent
                              ? copy("Submitting...", "Dang nop...")
                              : copy("Submit answer", "Nop cau tra loi")}
                          </button>
                        )}
                    </div>
                  )}

                  {!isListeningItem && false && (
                    <div className="flex items-center justify-end gap-3">
                      {!questionAnswer?.submitted && (
                        <button
                          onClick={() => void submitQuestion(question)}
                          disabled={
                            !canSubmitQuestion(question) || submittingCurrent
                          }
                          className="px-6 py-3 rounded-xl bg-[#155ca5] text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0f4c88]"
                        >
                          {submittingCurrent
                            ? copy("Submitting...", "Dang nop...")
                            : copy("Submit answer", "Nop cau tra loi")}
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
          {copy("Correct", "Dung")} {totalCorrect}/{totalQuestions}{" "}
          {copy("question(s)", "cau")} | {copy("Completed", "Hoan thanh")}{" "}
          {submittedPercent}%
        </div>

        <div className="flex items-center gap-3">
          {!isAdminPreview &&
            isCompactPassageItem &&
            !isCurrentItemComplete &&
            currentQuestions.some(
              (question) => !isSpeechType(question.questionType),
            ) && (
              <button
                onClick={() => void submitCurrentItem()}
                disabled={
                  submittingCurrent ||
                  currentQuestions.some(
                    (question) => !canSubmitQuestion(question),
                  )
                }
                className="px-6 py-3 rounded-xl bg-[#155ca5] text-white font-bold hover:bg-[#0f4c88] disabled:opacity-60"
              >
                {submittingCurrent
                  ? copy("Submitting...", "Dang nop...")
                  : isListeningItem
                    ? copy(
                        "Submit all listening answers",
                        "Nop toan bo cau nghe",
                      )
                    : copy("Submit all questions", "Nop toan bo cau hoi")}
              </button>
            )}
          {false && isCompactPassageItem && !isCurrentItemComplete && (
            <button
              onClick={() => void submitCurrentItem()}
              disabled={
                submittingCurrent ||
                currentQuestions.some(
                  (question) => !canSubmitQuestion(question),
                )
              }
              className="px-6 py-3 rounded-xl bg-[#155ca5] text-white font-bold hover:bg-[#0f4c88] disabled:opacity-60"
            >
              {submittingCurrent
                ? copy("Submitting...", "Dang nop...")
                : copy("Submit answer", "Nop cau tra loi")}
            </button>
          )}
          <button
            onClick={goNext}
            disabled={
              !canGoNext ||
              (currentIndex === items.length - 1 && completingLesson)
            }
            className="px-6 py-3 rounded-xl bg-[#27ae60] text-white font-bold hover:bg-[#1f8b4d] disabled:opacity-60"
          >
            {currentIndex === items.length - 1
              ? completingLesson
                ? copy("Saving result...", "Dang luu ket qua...")
                : copy("Finish", "Ket thuc")
              : currentGroup
                ? copy("Next group", "Nhom tiep theo")
                : copy("Next question", "Cau tiep")}
          </button>
        </div>

        {!isAdminPreview && isCompactPassageItem && !isCurrentItemComplete && (
          <p className="w-full text-sm text-amber-700">
            {unansweredCurrentQuestionLabels.length > 0
              ? copy(
                  `You still need to answer blank(s): ${unansweredCurrentQuestionLabels.join(", ")}.`,
                  `Ban con thieu o: ${unansweredCurrentQuestionLabels.join(", ")}.`,
                )
              : readyToSubmitCurrentQuestionLabels.length > 0
                ? copy(
                    "All blanks are filled. Submit all questions to continue.",
                    "Ban da dien du. Hay nop toan bo cau hoi de sang man tiep.",
                  )
                : null}
          </p>
        )}

        {submitApiError && (
          <p className="w-full text-sm text-red-600">{submitApiError}</p>
        )}
      </footer>
    </main>
  );
}

export default LessonRunner;
