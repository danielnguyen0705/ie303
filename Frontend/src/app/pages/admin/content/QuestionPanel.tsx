import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import * as XLSX from "xlsx";
import {
  Plus,
  Loader2,
  HelpCircle,
  Layers3,
  FileText,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronRight,
  Upload,
  PlayCircle,
} from "lucide-react";
import { adminApi } from "@/api";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { useNotificationPopup } from "@/utils/useNotificationPopup";
import { NotificationPopup } from "@/utils/NotificationPopup";

type QuestionOptionItem = {
  id?: number;
  optionKey?: string;
  content: string;
  isCorrect: boolean;
};

type QuestionItem = {
  id?: number;
  questionType?: string;
  content?: string;
  instruction?: string;
  hint?: string | null;
  audioUrl?: string | null;
  imageUrl?: string | null;
  questionData?: string | null;
  explanation?: string | null;
  correctAnswer?: string | null;
  lessonId?: number;
  questionGroupId?: number | null;
  options?: QuestionOptionItem[];
};

type QuestionGroupItem = {
  id?: number;
  groupType?: string;
  title?: string;
  instruction?: string;
  sharedContent?: string;
  audioUrl?: string | null;
  imageUrl?: string | null;
  groupData?: string | null;
  lessonId?: number;
  questions?: QuestionItem[];
};

type LessonQuestionPayload = {
  lessonId?: number;
  singleQuestions?: QuestionItem[];
  questionGroups?: QuestionGroupItem[];
};

type Props = {
  selectedLesson: {
    id: number;
    name?: string;
    lessonNumber?: number;
    orderIndex?: number;
    skillType?: string;
    durationMinutes?: number;
  } | null;
  questionsPayload?: LessonQuestionPayload | null;
  onReload: () => Promise<void> | void;
};

type DialogMode =
  | "create-single"
  | "create-group"
  | "edit-single"
  | "edit-group"
  | null;

type WizardStep = 1 | 2 | 3;

type SingleFormState = {
  id?: number;
  content: string;
  instruction: string;
  hint: string;
  audioFile: File | null;
  imageFile: File | null;
  existingAudioUrl?: string | null;
  existingImageUrl?: string | null;
  questionData: string;
  explanation: string;
  correctAnswer: string;
  options: QuestionOptionItem[];
};

type GroupChildFormState = {
  id?: number;
  content: string;
  instruction: string;
  hint: string;
  audioFile: File | null;
  imageFile: File | null;
  existingAudioUrl?: string | null;
  existingImageUrl?: string | null;
  questionData: string;
  explanation: string;
  correctAnswer: string;
  options: QuestionOptionItem[];
};

type GroupFormState = {
  id?: number;
  title: string;
  instruction: string;
  sharedContent: string;
  audioFile: File | null;
  imageFile: File | null;
  existingAudioUrl?: string | null;
  existingImageUrl?: string | null;
  groupData: string;
  questions: GroupChildFormState[];
};

type ExcelSingleRow = {
  questionType?: string;
  content?: string;
  instruction?: string;
  hint?: string;
  questionData?: string;
  explanation?: string;
  correctAnswer?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctOption?: string;
};

type ExcelGroupRow = {
  groupKey?: string;
  groupType?: string;
  title?: string;
  instruction?: string;
  sharedContent?: string;
  groupData?: string;
};

type ExcelGroupQuestionRow = {
  groupKey?: string;
  questionType?: string;
  content?: string;
  instruction?: string;
  hint?: string;
  questionData?: string;
  explanation?: string;
  correctAnswer?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctOption?: string;
};

const SINGLE_TYPES = [
  "QUALITATIVE_MC",
  "READING_MC",
  "CLOZE_MC",
  "TRUE_FALSE_NG",
  "WORD_BANK_FILL",
  "LIMITED_FILL",
  "WORD_FORM",
  "VERB_FORM",
  "SENTENCE_REORDER",
  "SENTENCE_REWRITE",
  "ESSAY_WRITING",
  "MATCHING",
  "PRONUNCIATION",
  "TOPIC_SPEAKING",
];

const GROUP_TYPES = [
  "READING_PASSAGE",
  "LISTENING_PASSAGE",
  "CLOZE_PASSAGE",
  "WORD_BANK",
  "MATCHING",
  "WRITING_TASK",
  "SPEAKING_TASK",
];

const OPTION_BASED_TYPES = [
  "QUALITATIVE_MC",
  "READING_MC",
  "CLOZE_MC",
  "TRUE_FALSE_NG",
];

const TEXT_ANSWER_TYPES = [
  "WORD_BANK_FILL",
  "LIMITED_FILL",
  "WORD_FORM",
  "VERB_FORM",
  "SENTENCE_REORDER",
  "SENTENCE_REWRITE",
  "ESSAY_WRITING",
  "PRONUNCIATION",
  "TOPIC_SPEAKING",
];

const AUDIO_SUPPORTED_SINGLE_TYPES = ["PRONUNCIATION", "TOPIC_SPEAKING"];
const IMAGE_SUPPORTED_SINGLE_TYPES = [
  "QUALITATIVE_MC",
  "READING_MC",
  "CLOZE_MC",
  "TRUE_FALSE_NG",
  "MATCHING",
];

const AUDIO_SUPPORTED_GROUP_TYPES = ["LISTENING_PASSAGE", "SPEAKING_TASK"];
const IMAGE_SUPPORTED_GROUP_TYPES = [
  "READING_PASSAGE",
  "MATCHING",
  "WRITING_TASK",
];

const OPTION_KEYS = ["A", "B", "C", "D"] as const;
const TRUE_FALSE_VALUES = ["TRUE", "FALSE", "NOT GIVEN"] as const;

function normalizeAnswerToken(value?: string | null) {
  return String(value || "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function createDefaultOptions(): QuestionOptionItem[] {
  return OPTION_KEYS.map((key) => ({
    optionKey: key,
    content: "",
    isCorrect: false,
  }));
}

function createTrueFalseOptions(
  correctAnswer?: string | null,
  existingOptions?: QuestionOptionItem[] | null,
): QuestionOptionItem[] {
  const normalizedCorrect = normalizeAnswerToken(correctAnswer);

  return TRUE_FALSE_VALUES.map((value, index) => {
    const optionKey = OPTION_KEYS[index];
    const existing = existingOptions?.find(
      (option) =>
        option.optionKey === optionKey ||
        normalizeAnswerToken(option.content) === value,
    );

    return {
      id: existing?.id,
      optionKey,
      content: value,
      isCorrect:
        normalizeAnswerToken(existing?.content) === normalizedCorrect ||
        Boolean(existing?.isCorrect) ||
        value === normalizedCorrect,
    };
  });
}

function createEmptySingleForm(): SingleFormState {
  return {
    content: "",
    instruction: "",
    hint: "",
    audioFile: null,
    imageFile: null,
    existingAudioUrl: "",
    existingImageUrl: "",
    questionData: "",
    explanation: "",
    correctAnswer: "",
    options: createDefaultOptions(),
  };
}

function createEmptyGroupChild(): GroupChildFormState {
  return {
    content: "",
    instruction: "",
    hint: "",
    audioFile: null,
    imageFile: null,
    existingAudioUrl: "",
    existingImageUrl: "",
    questionData: "",
    explanation: "",
    correctAnswer: "",
    options: createDefaultOptions(),
  };
}

function createEmptyGroupForm(): GroupFormState {
  return {
    title: "",
    instruction: "",
    sharedContent: "",
    audioFile: null,
    imageFile: null,
    existingAudioUrl: "",
    existingImageUrl: "",
    groupData: "",
    questions: [createEmptyGroupChild()],
  };
}

function isOptionBasedType(type?: string) {
  return !!type && OPTION_BASED_TYPES.includes(type);
}

function isTextAnswerType(type?: string) {
  return !!type && TEXT_ANSWER_TYPES.includes(type);
}

function isTrueFalseType(type?: string) {
  return type === "TRUE_FALSE_NG";
}

function supportsSingleAudio(type?: string) {
  return !!type && AUDIO_SUPPORTED_SINGLE_TYPES.includes(type);
}

function supportsSingleImage(type?: string) {
  return !!type && IMAGE_SUPPORTED_SINGLE_TYPES.includes(type);
}

function supportsGroupAudio(type?: string) {
  return !!type && AUDIO_SUPPORTED_GROUP_TYPES.includes(type);
}

function supportsGroupImage(type?: string) {
  return !!type && IMAGE_SUPPORTED_GROUP_TYPES.includes(type);
}

function shouldShowQuestionData(type?: string) {
  return ["MATCHING", "WORD_BANK_FILL", "SENTENCE_REORDER", "ESSAY_WRITING"].includes(
    type || "",
  );
}

function shouldShowExplanation(type?: string) {
  return !["TOPIC_SPEAKING"].includes(type || "");
}

function isMatchingType(type?: string) {
  return type === "MATCHING";
}

function shouldImportCorrectAnswer(type?: string) {
  return isTextAnswerType(type) || isMatchingType(type);
}

function shouldShowGroupData(type?: string) {
  return ["WORD_BANK", "MATCHING"].includes(type || "");
}

function getQuestionDataFieldMeta(type?: string) {
  switch (type) {
    case "WORD_BANK_FILL":
      return {
        label: "Word Bank Data",
        placeholder: 'Vi du: {"wordBank":["analyze","design","ship"]}',
      };
    case "SENTENCE_REORDER":
      return {
        label: "Sentence Parts",
        placeholder: 'Vi du: {"words":["First, gather data","then compare results"]}',
      };
    case "ESSAY_WRITING":
      return {
        label: "Writing Rubric / Prompt Data",
        placeholder: 'Vi du: {"minWords":150,"bandFocus":["task response","grammar"]}',
      };
    default:
      return {
        label: "Question Data",
        placeholder: "JSON/string phu neu loai cau hoi nay can du lieu rieng",
      };
  }
}

function getSelectedCorrectOptionContent(options: QuestionOptionItem[]) {
  return options.find((option) => option.isCorrect)?.content || "";
}

function parseMatchingMap(raw?: string | null) {
  if (!raw?.trim()) return null;

  try {
    const parsed = JSON.parse(raw);

    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
      return null;
    }

    if (
      "left" in parsed ||
      "right" in parsed ||
      "answers" in parsed
    ) {
      const left = Array.isArray((parsed as any).left)
        ? (parsed as any).left.map(String).map((item: string) => item.trim()).filter(Boolean)
        : [];
      const right = Array.isArray((parsed as any).right)
        ? (parsed as any).right.map(String).map((item: string) => item.trim()).filter(Boolean)
        : [];
      const answers =
        (parsed as any).answers && typeof (parsed as any).answers === "object"
          ? Object.entries((parsed as any).answers).reduce<Record<string, string>>(
            (acc, [key, value]) => {
              if (key && value != null) {
                acc[String(key).trim()] = String(value).trim();
              }
              return acc;
            },
            {},
          )
          : {};

      return { left, right, answers };
    }

    const answers = Object.entries(parsed as Record<string, unknown>).reduce<Record<string, string>>(
      (acc, [key, value]) => {
        if (key && value != null) {
          acc[String(key).trim()] = String(value).trim();
        }
        return acc;
      },
      {},
    );

    return {
      left: Object.keys(answers),
      right: Array.from(new Set(Object.values(answers))),
      answers,
    };
  } catch {
    return null;
  }
}

function validateMatchingQuestionData(
  questionData?: string | null,
  correctAnswer?: string | null,
) {
  const parsedQuestionData = parseMatchingMap(questionData);
  const parsedCorrectAnswer = parseMatchingMap(correctAnswer);
  const left =
    parsedQuestionData?.left.length
      ? parsedQuestionData.left
      : parsedCorrectAnswer?.left || [];
  const right =
    parsedQuestionData?.right.length
      ? parsedQuestionData.right
      : parsedCorrectAnswer?.right || [];
  const answers =
    Object.keys(parsedQuestionData?.answers || {}).length > 0
      ? parsedQuestionData?.answers || {}
      : parsedCorrectAnswer?.answers || {};

  if (left.length === 0 || right.length === 0 || Object.keys(answers).length === 0) {
    return "MATCHING requires questionData/correctAnswer in valid JSON format";
  }

  const missingLeftAnswers = left.filter((item) => !answers[item]);
  if (missingLeftAnswers.length > 0) {
    return `MATCHING is missing answers for: ${missingLeftAnswers.join(", ")}`;
  }

  return null;
}

type MatchingPair = {
  left: string;
  right: string;
};

function toMatchingPairs(questionData?: string | null, correctAnswer?: string | null): MatchingPair[] {
  const parsedQuestionData = parseMatchingMap(questionData);
  const parsedCorrectAnswer = parseMatchingMap(correctAnswer);
  const answers =
    Object.keys(parsedQuestionData?.answers || {}).length > 0
      ? parsedQuestionData?.answers || {}
      : parsedCorrectAnswer?.answers || {};

  const orderedLeft =
    parsedQuestionData?.left.length
      ? parsedQuestionData.left
      : Object.keys(answers);

  if (orderedLeft.length === 0) {
    return [{ left: "", right: "" }];
  }

  return orderedLeft.map((left) => ({
    left,
    right: answers[left] || "",
  }));
}

function buildMatchingPayloadFromPairs(pairs: MatchingPair[]) {
  const normalizedPairs = pairs
    .map((pair) => ({
      left: pair.left.trim(),
      right: pair.right.trim(),
    }))
    .filter((pair) => pair.left || pair.right);

  const answers = normalizedPairs.reduce<Record<string, string>>((acc, pair) => {
    if (pair.left && pair.right) {
      acc[pair.left] = pair.right;
    }
    return acc;
  }, {});

  const left = normalizedPairs.map((pair) => pair.left).filter(Boolean);
  const right = Array.from(
    new Set(normalizedPairs.map((pair) => pair.right).filter(Boolean)),
  );

  return {
    questionData: JSON.stringify(
      {
        left,
        right,
        answers,
      },
      null,
      2,
    ),
    correctAnswer: JSON.stringify(answers, null, 2),
  };
}

function MatchingEditor({
  questionData,
  correctAnswer,
  onChange,
}: {
  questionData: string;
  correctAnswer: string;
  onChange: (next: { questionData: string; correctAnswer: string }) => void;
}) {
  const pairs = useMemo(
    () => toMatchingPairs(questionData, correctAnswer),
    [questionData, correctAnswer],
  );

  const updatePair = (
    index: number,
    field: "left" | "right",
    value: string,
  ) => {
    const nextPairs = pairs.map((pair, pairIndex) =>
      pairIndex === index ? { ...pair, [field]: value } : pair,
    );
    onChange(buildMatchingPayloadFromPairs(nextPairs));
  };

  const addPair = () => {
    onChange(buildMatchingPayloadFromPairs([...pairs, { left: "", right: "" }]));
  };

  const removePair = (index: number) => {
    const nextPairs = pairs.filter((_, pairIndex) => pairIndex !== index);
    onChange(
      buildMatchingPayloadFromPairs(
        nextPairs.length > 0 ? nextPairs : [{ left: "", right: "" }],
      ),
    );
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Matching Pairs</p>
          <p className="text-xs text-slate-500">
            Nhap tung cap ben trai va ben phai. He thong tu dong tao JSON dung format.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={addPair}>
          <Plus className="mr-2 h-4 w-4" />
          Them cap
        </Button>
      </div>

      <div className="space-y-3">
        {pairs.map((pair, index) => (
          <div
            key={`matching-pair-${index}`}
            className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-3 md:grid-cols-[1fr_1fr_auto]"
          >
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500">
                Left item {index + 1}
              </label>
              <Input
                value={pair.left}
                onChange={(e) => updatePair(index, "left", e.target.value)}
                placeholder="Vi du: cat"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500">Right match</label>
              <Input
                value={pair.right}
                onChange={(e) => updatePair(index, "right", e.target.value)}
                placeholder="Vi du: con meo"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => removePair(index)}
                disabled={pairs.length === 1}
              >
                Xoa
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 text-xs text-slate-500 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="mb-2 font-semibold text-slate-700">questionData preview</p>
          <pre className="whitespace-pre-wrap break-words">{questionData || "{}"}</pre>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="mb-2 font-semibold text-slate-700">correctAnswer preview</p>
          <pre className="whitespace-pre-wrap break-words">{correctAnswer || "{}"}</pre>
        </div>
      </div>
    </div>
  );
}

function normalizePayload(payload?: LessonQuestionPayload | null) {
  const singleQuestions = Array.isArray(payload?.singleQuestions)
    ? payload.singleQuestions
    : [];

  const questionGroups = Array.isArray(payload?.questionGroups)
    ? payload.questionGroups
    : [];

  return {
    singleQuestions,
    questionGroups,
    totalQuestions:
      singleQuestions.length +
      questionGroups.reduce(
        (sum, group) =>
          sum + (Array.isArray(group.questions) ? group.questions.length : 0),
        0,
      ),
  };
}

function getDefaultChildType(groupType?: string): string {
  switch (groupType) {
    case "CLOZE_PASSAGE":
      return "CLOZE_MC";
    case "WORD_BANK":
      return "WORD_BANK_FILL";
    case "MATCHING":
      return "MATCHING";
    case "WRITING_TASK":
      return "ESSAY_WRITING";
    case "SPEAKING_TASK":
      return "TOPIC_SPEAKING";
    case "LISTENING_PASSAGE":
      return "READING_MC";
    case "READING_PASSAGE":
    default:
      return "READING_MC";
  }
}

function buildOptionsFromExcelRow(row: {
  questionType?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer?: string;
  correctOption?: string;
}) {
  const questionType = String(row.questionType || "")
    .trim()
    .toUpperCase();
  const correctOption = String(row.correctOption || "")
    .trim()
    .toUpperCase();
  const correctAnswer = String(row.correctAnswer || "")
    .trim()
    .toUpperCase();

  const excelOptions = OPTION_KEYS.map((key) => {
    const content = String(
      row[`option${key}` as "optionA" | "optionB" | "optionC" | "optionD"] || "",
    ).trim();

    return {
      optionKey: key,
      content,
      isCorrect:
        correctOption === key || (content && content.toUpperCase() === correctAnswer),
    };
  }).filter((option) => option.content);

  if (excelOptions.length > 0) {
    return excelOptions;
  }

  if (questionType === "TRUE_FALSE_NG") {
    const fallbackOptions = ["TRUE", "FALSE", "NOT GIVEN"];
    const normalizedTarget = normalizeAnswerToken(correctAnswer);

    return fallbackOptions.map((content, index) => ({
      optionKey: OPTION_KEYS[index],
      content,
      isCorrect:
        normalizeAnswerToken(content) === normalizedTarget ||
        correctOption === OPTION_KEYS[index],
    }));
  }

  return [];
}

function mapQuestionToSingleForm(question: QuestionItem): SingleFormState {
  const options = isTrueFalseType(question.questionType)
    ? createTrueFalseOptions(question.correctAnswer, question.options)
    : Array.isArray(question.options) && question.options.length > 0
      ? OPTION_KEYS.map((key) => {
        const found = question.options?.find((opt) => opt.optionKey === key);
        return {
          id: found?.id,
          optionKey: key,
          content: found?.content || "",
          isCorrect: Boolean(found?.isCorrect),
        };
      })
      : createDefaultOptions();

  return {
    id: question.id,
    content: question.content || "",
    instruction: question.instruction || "",
    hint: question.hint || "",
    audioFile: null,
    imageFile: null,
    existingAudioUrl: question.audioUrl || "",
    existingImageUrl: question.imageUrl || "",
    questionData: question.questionData || "",
    explanation: question.explanation || "",
    correctAnswer: question.correctAnswer || "",
    options,
  };
}

function mapQuestionToGroupChildForm(question: QuestionItem): GroupChildFormState {
  const options = isTrueFalseType(question.questionType)
    ? createTrueFalseOptions(question.correctAnswer, question.options)
    : Array.isArray(question.options) && question.options.length > 0
      ? OPTION_KEYS.map((key) => {
        const found = question.options?.find((opt) => opt.optionKey === key);
        return {
          id: found?.id,
          optionKey: key,
          content: found?.content || "",
          isCorrect: Boolean(found?.isCorrect),
        };
      })
      : createDefaultOptions();

  return {
    id: question.id,
    content: question.content || "",
    instruction: question.instruction || "",
    hint: question.hint || "",
    audioFile: null,
    imageFile: null,
    existingAudioUrl: question.audioUrl || "",
    existingImageUrl: question.imageUrl || "",
    questionData: question.questionData || "",
    explanation: question.explanation || "",
    correctAnswer: question.correctAnswer || "",
    options,
  };
}

function mapGroupToForm(group: QuestionGroupItem): GroupFormState {
  return {
    id: group.id,
    title: group.title || "",
    instruction: group.instruction || "",
    sharedContent: group.sharedContent || "",
    audioFile: null,
    imageFile: null,
    existingAudioUrl: group.audioUrl || "",
    existingImageUrl: group.imageUrl || "",
    groupData: group.groupData || "",
    questions:
      Array.isArray(group.questions) && group.questions.length > 0
        ? group.questions.map(mapQuestionToGroupChildForm)
        : [createEmptyGroupChild()],
  };
}

export default function QuestionPanel({
  selectedLesson,
  questionsPayload,
  onReload,
}: Props) {
  const { success, error, warning, notification, close } =
    useNotificationPopup();

  const importInputRef = useRef<HTMLInputElement | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [step, setStep] = useState<WizardStep>(1);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);

  const [selectedSingleType, setSelectedSingleType] = useState("");
  const [selectedGroupType, setSelectedGroupType] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [singleForm, setSingleForm] = useState<SingleFormState>(
    createEmptySingleForm(),
  );
  const [groupForm, setGroupForm] = useState<GroupFormState>(
    createEmptyGroupForm(),
  );

  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>(
    {},
  );
  const [expandedEditorQuestions, setExpandedEditorQuestions] = useState<
    Record<number, boolean>
  >({ 0: true });

  const normalized = useMemo(
    () => normalizePayload(questionsPayload),
    [questionsPayload],
  );

  useEffect(() => {
    if (!isTrueFalseType(selectedSingleType)) return;

    setSingleForm((prev) => ({
      ...prev,
      options: createTrueFalseOptions(
        getSelectedCorrectOptionContent(prev.options) || prev.correctAnswer,
        prev.options,
      ),
      correctAnswer: getSelectedCorrectOptionContent(prev.options) || prev.correctAnswer,
    }));
  }, [selectedSingleType]);

  const resetAll = () => {
    setStep(1);
    setDialogMode(null);
    setSelectedSingleType("");
    setSelectedGroupType("");
    setSubmitting(false);
    setSingleForm(createEmptySingleForm());
    setGroupForm(createEmptyGroupForm());
    setExpandedEditorQuestions({ 0: true });
  };

  const openCreateDialog = () => {
    if (!selectedLesson) {
      error({
        title: "No lesson selected",
        message: "You need to select a lesson before adding questions",
        showCancelButton: false,
        confirmText: "Close",
      });
      return;
    }

    resetAll();
    setIsDialogOpen(true);
  };

  const openEditSingleDialog = (question: QuestionItem) => {
    if (!selectedLesson || !question.id) return;

    resetAll();
    setDialogMode("edit-single");
    setSelectedSingleType(question.questionType || "");
    setSingleForm(mapQuestionToSingleForm(question));
    setStep(3);
    setIsDialogOpen(true);
  };

  const openEditGroupDialog = (group: QuestionGroupItem) => {
    if (!selectedLesson || !group.id) return;

    resetAll();
    setDialogMode("edit-group");
    setSelectedGroupType(group.groupType || "");
    setGroupForm(mapGroupToForm(group));
    setStep(3);
    setIsDialogOpen(true);
  };

  const toggleGroup = (groupId?: number) => {
    if (!groupId) return;
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const updateSingleOption = (
    index: number,
    field: "content" | "isCorrect",
    value: string | boolean,
  ) => {
    setSingleForm((prev) => {
      const next = [...prev.options];

      if (field === "isCorrect") {
        next.forEach((_, i) => {
          next[i] = {
            ...next[i],
            isCorrect: i === index ? Boolean(value) : false,
          };
        });
      } else {
        next[index] = {
          ...next[index],
          content: String(value),
        };
      }

      return { ...prev, options: next };
    });
  };

  const updateGroupQuestion = (
    qIndex: number,
    field:
      | "content"
      | "instruction"
      | "hint"
      | "questionData"
      | "explanation"
      | "correctAnswer",
    value: string,
  ) => {
    setGroupForm((prev) => {
      const next = [...prev.questions];
      next[qIndex] = { ...next[qIndex], [field]: value };
      return { ...prev, questions: next };
    });
  };

  const updateGroupOption = (
    qIndex: number,
    oIndex: number,
    field: "content" | "isCorrect",
    value: string | boolean,
  ) => {
    setGroupForm((prev) => {
      const nextQuestions = [...prev.questions];
      const options = [...nextQuestions[qIndex].options];

      if (field === "isCorrect") {
        options.forEach((_, i) => {
          options[i] = {
            ...options[i],
            isCorrect: i === oIndex ? Boolean(value) : false,
          };
        });
      } else {
        options[oIndex] = {
          ...options[oIndex],
          content: String(value),
        };
      }

      nextQuestions[qIndex] = {
        ...nextQuestions[qIndex],
        options,
      };

      return {
        ...prev,
        questions: nextQuestions,
      };
    });
  };

  const addChildQuestion = () => {
    setGroupForm((prev) => {
      const nextIndex = prev.questions.length;
      setExpandedEditorQuestions((current) => ({
        ...current,
        [nextIndex]: true,
      }));

      return {
        ...prev,
        questions: [...prev.questions, createEmptyGroupChild()],
      };
    });
  };

  const removeChildQuestion = (index: number) => {
    setGroupForm((prev) => {
      if (prev.questions.length <= 1) return prev;
      return {
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index),
      };
    });

    setExpandedEditorQuestions((prev) => {
      const nextEntries = Object.entries(prev).reduce<Record<number, boolean>>(
        (acc, [rawKey, value]) => {
          const key = Number(rawKey);
          if (key < index) {
            acc[key] = value;
          } else if (key > index) {
            acc[key - 1] = value;
          }
          return acc;
        },
        {},
      );

      if (Object.keys(nextEntries).length === 0) {
        nextEntries[0] = true;
      }

      return nextEntries;
    });
  };

  const toggleEditorQuestion = (index: number) => {
    setExpandedEditorQuestions((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const setAllEditorQuestionsExpanded = (expanded: boolean) => {
    setExpandedEditorQuestions(
      groupForm.questions.reduce<Record<number, boolean>>((acc, _, index) => {
        acc[index] = expanded;
        return acc;
      }, {}),
    );
  };

  const validateSingle = () => {
    if (!selectedLesson?.id) return "Missing lessonId";
    if (!selectedSingleType) return "You have not selected a question type";
    if (!singleForm.content.trim()) return "Content cannot be empty";

    if (isMatchingType(selectedSingleType)) {
      return validateMatchingQuestionData(
        singleForm.questionData,
        singleForm.correctAnswer,
      );
    }

    if (isOptionBasedType(selectedSingleType)) {
      const emptyOption = singleForm.options.find((opt) => !opt.content.trim());
      if (emptyOption) return "Options cannot be empty";

      const hasCorrect = singleForm.options.some((opt) => opt.isCorrect);
      if (!hasCorrect) return "You must choose one correct answer";
    }

    if (
      isTextAnswerType(selectedSingleType) &&
      !singleForm.correctAnswer.trim()
    ) {
      return "Correct answer cannot be empty";
    }

    return null;
  };

  const validateGroup = () => {
    if (!selectedLesson?.id) return "Missing lessonId";
    if (!selectedGroupType) return "You have not selected a group type";
    if (!groupForm.title.trim()) return "Group title cannot be empty";

    const childType = getDefaultChildType(selectedGroupType);

    for (let i = 0; i < groupForm.questions.length; i += 1) {
      const q = groupForm.questions[i];

      if (!q.content.trim()) {
        return `Question ${i + 1}: content cannot be empty`;
      }

      if (isMatchingType(childType)) {
        const matchingError = validateMatchingQuestionData(
          q.questionData,
          q.correctAnswer,
        );
        if (matchingError) {
          return `Question ${i + 1}: ${matchingError}`;
        }
      }

      if (isOptionBasedType(childType)) {
        const emptyOption = q.options.find((opt) => !opt.content.trim());
        if (emptyOption) {
          return `Question ${i + 1}: option cannot be empty`;
        }

        const hasCorrect = q.options.some((opt) => opt.isCorrect);
        if (!hasCorrect) {
          return `Question ${i + 1}: you must choose one correct answer`;
        }
      }

      if (isTextAnswerType(childType) && !q.correctAnswer.trim()) {
        return `Question ${i + 1}: correct answer cannot be empty`;
      }
    }

    return null;
  };

  const upsertQuestionOptions = async (
    questionId: number,
    options: QuestionOptionItem[],
  ) => {
    for (let i = 0; i < options.length; i += 1) {
      const option = options[i];
      const payload = {
        questionId,
        optionKey: option.optionKey || OPTION_KEYS[i],
        content: option.content.trim(),
        isCorrect: option.isCorrect,
      };

      if (option.id) {
        const optionRes = await adminApi.updateQuestionOption({
          optionId: option.id,
          data: payload,
        });

        if (!optionRes.success) {
          throw new Error(
            optionRes.error?.message || `Could not update option ${i + 1}`,
          );
        }
      } else {
        const optionRes = await adminApi.createQuestionOption(payload);

        if (!optionRes.success) {
          throw new Error(
            optionRes.error?.message || `Could not create option ${i + 1}`,
          );
        }
      }
    }
  };

  const handleImportExcel = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !selectedLesson?.id) return;

    try {
      setSubmitting(true);

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });

      const singleSheet = workbook.Sheets["single_questions"];
      const groupsSheet = workbook.Sheets["question_groups"];
      const groupQuestionsSheet = workbook.Sheets["group_questions"];

      const singleRows: ExcelSingleRow[] = singleSheet
        ? XLSX.utils.sheet_to_json(singleSheet, { defval: "" })
        : [];

      const groupRows: ExcelGroupRow[] = groupsSheet
        ? XLSX.utils.sheet_to_json(groupsSheet, { defval: "" })
        : [];

      const groupQuestionRows: ExcelGroupQuestionRow[] = groupQuestionsSheet
        ? XLSX.utils.sheet_to_json(groupQuestionsSheet, { defval: "" })
        : [];

      for (const row of singleRows) {
        const questionType = String(row.questionType || "").trim();
        const content = String(row.content || "").trim();
        if (!questionType || !content) continue;

        const createRes = await adminApi.createContentQuestion({
          lessonId: selectedLesson.id,
          questionType: questionType as never,
          content,
          instruction: String(row.instruction || "").trim() || undefined,
          hint: String(row.hint || "").trim() || undefined,
          questionData: String(row.questionData || "").trim() || undefined,
          explanation: String(row.explanation || "").trim() || undefined,
          correctAnswer: shouldImportCorrectAnswer(questionType)
            ? String(row.correctAnswer || "").trim() || undefined
            : undefined,
          questionGroupId: null,
        });

        if (!createRes.success || !createRes.data?.id) {
          throw new Error(createRes.error?.message || "Failed to import single question");
        }

        if (isOptionBasedType(questionType)) {
          const options = buildOptionsFromExcelRow({
            ...row,
            questionType,
          });
          if (options.length === 0) {
            throw new Error(
              `Single question "${content}" does not have valid options in the Excel file`,
            );
          }
          await upsertQuestionOptions(createRes.data.id, options);
        }
      }

      for (const groupRow of groupRows) {
        const groupKey = String(groupRow.groupKey || "").trim();
        const groupType = String(groupRow.groupType || "").trim();
        if (!groupKey || !groupType) continue;

        const groupRes = await adminApi.createQuestionGroup({
          lessonId: selectedLesson.id,
          groupType: groupType as never,
          title: String(groupRow.title || "").trim() || undefined,
          instruction: String(groupRow.instruction || "").trim() || undefined,
          sharedContent: String(groupRow.sharedContent || "").trim() || undefined,
          groupData: String(groupRow.groupData || "").trim() || undefined,
        });

        if (!groupRes.success || !groupRes.data?.id) {
          throw new Error(groupRes.error?.message || "Failed to import group");
        }

        const childType = getDefaultChildType(groupType);
        const children = groupQuestionRows.filter(
          (row) => String(row.groupKey || "").trim() === groupKey,
        );

        for (const child of children) {
          const explicitChildType = String(child.questionType || "")
            .trim()
            .toUpperCase();
          const resolvedChildType = explicitChildType || childType;
          const content = String(child.content || "").trim();
          if (!content) continue;

          const questionRes = await adminApi.createContentQuestion({
            lessonId: selectedLesson.id,
            questionType: resolvedChildType as never,
            content,
            instruction: String(child.instruction || "").trim() || undefined,
            hint: String(child.hint || "").trim() || undefined,
            questionData: String(child.questionData || "").trim() || undefined,
            explanation: String(child.explanation || "").trim() || undefined,
            correctAnswer: shouldImportCorrectAnswer(resolvedChildType)
              ? String(child.correctAnswer || "").trim() || undefined
              : undefined,
            questionGroupId: groupRes.data.id,
          });

          if (!questionRes.success || !questionRes.data?.id) {
            throw new Error(
              questionRes.error?.message || "Failed to import child question",
            );
          }

          if (isOptionBasedType(resolvedChildType)) {
            const options = buildOptionsFromExcelRow({
              ...child,
              questionType: resolvedChildType,
            });
            if (options.length === 0) {
              throw new Error(
                `Group question "${content}" does not have valid options in the Excel file`,
              );
            }
            await upsertQuestionOptions(questionRes.data.id, options);
          }
        }
      }

      await onReload();

      success({
        title: "Success",
        message: "Excel imported successfully",
        autoClose: true,
        showCancelButton: false,
      });
    } catch (e: any) {
      error({
        title: "Excel import failed",
        message:
          e?.message ||
          "Please check the sheet names: single_questions, question_groups, group_questions",
        showCancelButton: false,
        confirmText: "Close",
      });
    } finally {
      setSubmitting(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleSubmitSingle = async () => {
    const validationError = validateSingle();
    if (validationError) {
      error({
        title: "Missing information",
        message: validationError,
        showCancelButton: false,
        confirmText: "Close",
      });
      return;
    }

    try {
      setSubmitting(true);

      const isEditing = dialogMode === "edit-single" && !!singleForm.id;

      const payload = {
        lessonId: selectedLesson!.id,
        questionType: selectedSingleType as never,
        content: singleForm.content.trim(),
        instruction: singleForm.instruction.trim() || undefined,
        hint: singleForm.hint.trim() || undefined,
        audioUrl: supportsSingleAudio(selectedSingleType)
          ? singleForm.audioFile || singleForm.existingAudioUrl?.trim() || undefined
          : undefined,
        imageUrl: supportsSingleImage(selectedSingleType)
          ? singleForm.imageFile || undefined
          : undefined,
        questionData: shouldShowQuestionData(selectedSingleType)
          ? singleForm.questionData.trim() || undefined
          : undefined,
        explanation: shouldShowExplanation(selectedSingleType)
          ? singleForm.explanation.trim() || undefined
          : undefined,
        correctAnswer: isTextAnswerType(selectedSingleType)
          ? singleForm.correctAnswer.trim()
          : isTrueFalseType(selectedSingleType)
            ? getSelectedCorrectOptionContent(singleForm.options).trim() || undefined
            : undefined,
        questionGroupId: null,
      };

      const questionRes = isEditing
        ? await adminApi.updateContentQuestion({
          questionId: singleForm.id!,
          data: payload,
        })
        : await adminApi.createContentQuestion(payload);

      if (!questionRes.success || !questionRes.data?.id) {
        throw new Error(
          questionRes.error?.message ||
          (isEditing ? "Could not update question" : "Could not create question"),
        );
      }

      if (isOptionBasedType(selectedSingleType)) {
        await upsertQuestionOptions(questionRes.data.id, singleForm.options);
      }

      setIsDialogOpen(false);
      resetAll();
      await onReload();

      success({
        title: "Success",
        message: isEditing ? "Question updated successfully" : "Question created successfully",
        autoClose: true,
        showCancelButton: false,
      });
    } catch (e: any) {
      error({
        title:
          dialogMode === "edit-single"
            ? "Failed to update question"
            : "Failed to create question",
        message: e?.message || "An unexpected error occurred",
        showCancelButton: false,
        confirmText: "Close",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitGroup = async () => {
    const validationError = validateGroup();
    if (validationError) {
      error({
        title: "Missing information",
        message: validationError,
        showCancelButton: false,
        confirmText: "Close",
      });
      return;
    }

    let createdGroupId: number | null = null;

    try {
      setSubmitting(true);

      const isEditing = dialogMode === "edit-group" && !!groupForm.id;

      const groupAudioUrl = supportsGroupAudio(selectedGroupType)
        ? groupForm.audioFile || groupForm.existingAudioUrl?.trim() || undefined
        : undefined;
      const groupImageUrl = supportsGroupImage(selectedGroupType)
        ? groupForm.imageFile || groupForm.existingImageUrl?.trim() || undefined
        : undefined;

      const groupRes = isEditing
        ? await adminApi.updateQuestionGroup({
          groupId: groupForm.id!,
          data: {
            lessonId: selectedLesson!.id,
            groupType: selectedGroupType as never,
            title: groupForm.title.trim(),
            instruction: groupForm.instruction.trim() || undefined,
            sharedContent: groupForm.sharedContent.trim() || undefined,
            audioUrl: groupAudioUrl,
            imageUrl: groupImageUrl,
            groupData: shouldShowGroupData(selectedGroupType)
              ? groupForm.groupData.trim() || undefined
              : undefined,
          },
        })
        : await adminApi.createQuestionGroup({
          lessonId: selectedLesson!.id,
          groupType: selectedGroupType as never,
          title: groupForm.title.trim(),
          instruction: groupForm.instruction.trim() || undefined,
          sharedContent: groupForm.sharedContent.trim() || undefined,
          audioUrl: groupAudioUrl,
          imageUrl: groupImageUrl,
          groupData: shouldShowGroupData(selectedGroupType)
            ? groupForm.groupData.trim() || undefined
            : undefined,
        });

      if (!groupRes.success || !groupRes.data?.id) {
        throw new Error(
          groupRes.error?.message ||
          (isEditing
            ? "Could not update question group"
            : "Could not create question group"),
        );
      }

      const groupId = groupRes.data.id;
      if (!isEditing) {
        createdGroupId = groupId;
      }
      const childType = getDefaultChildType(selectedGroupType);

      const existingChildIds =
        isEditing && Array.isArray(questionsPayload?.questionGroups)
          ? (
            questionsPayload.questionGroups.find((g) => g.id === groupForm.id)
              ?.questions || []
          )
            .map((q) => q.id)
            .filter((id): id is number => Boolean(id))
          : [];

      const currentChildIds = groupForm.questions
        .map((q) => q.id)
        .filter((id): id is number => Boolean(id));

      const removedChildIds = existingChildIds.filter(
        (id) => !currentChildIds.includes(id),
      );

      for (const removedId of removedChildIds) {
        const delRes = await adminApi.deleteContentQuestion({ id: removedId });
        if (!delRes.success) {
          throw new Error(delRes.error?.message || "Could not delete the removed child question");
        }
      }

      for (let qIndex = 0; qIndex < groupForm.questions.length; qIndex += 1) {
        const q = groupForm.questions[qIndex];

        const payload = {
          lessonId: selectedLesson!.id,
          questionType: childType as never,
          content: q.content.trim(),
          instruction:
            q.instruction.trim() || groupForm.instruction.trim() || undefined,
          hint: q.hint.trim() || undefined,
          audioUrl: undefined,
          imageUrl: undefined,
          questionData: shouldShowQuestionData(childType)
            ? q.questionData.trim() || undefined
            : undefined,
          explanation: shouldShowExplanation(childType)
            ? q.explanation.trim() || undefined
            : undefined,
          correctAnswer: isTextAnswerType(childType)
            ? q.correctAnswer.trim()
            : isTrueFalseType(childType)
              ? getSelectedCorrectOptionContent(q.options).trim() || undefined
              : undefined,
          questionGroupId: groupId,
        };

        const questionRes = q.id
          ? await adminApi.updateContentQuestion({
            questionId: q.id,
            data: payload,
          })
          : await adminApi.createContentQuestion(payload);

        if (!questionRes.success || !questionRes.data?.id) {
          throw new Error(
            questionRes.error?.message ||
            `${q.id ? "Could not update" : "Could not create"} child question ${qIndex + 1
            }`,
          );
        }

        if (isOptionBasedType(childType)) {
          await upsertQuestionOptions(questionRes.data.id, q.options);
        }
      }

      setIsDialogOpen(false);
      resetAll();
      await onReload();

      success({
        title: "Success",
        message: isEditing ? "Question group updated successfully" : "Question group created successfully",
        autoClose: true,
        showCancelButton: false,
      });
    } catch (e: any) {
      // Avoid leaving orphaned groups when creating group children fails mid-flight.
      if (dialogMode === "create-group" && createdGroupId) {
        await adminApi.deleteQuestionGroup({ id: createdGroupId });
      }

      error({
        title:
          dialogMode === "edit-group"
            ? "Failed to update question group"
            : "Failed to create question group",
        message: e?.message || "An unexpected error occurred",
        showCancelButton: false,
        confirmText: "Close",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSingleQuestion = async (questionId?: number) => {
    if (!questionId) return;

    warning({
      title: "Delete question",
      message: "Are you sure you want to delete this question?",
      description: "This action cannot be undone",
      confirmText: "Delete",
      cancelText: "Cancel",
      showCancelButton: true,
      onConfirm: async () => {
        const res = await adminApi.deleteContentQuestion({ id: questionId });
        if (res.success) {
          await onReload();
          success({
            title: "Success",
            message: "Question deleted successfully",
            autoClose: true,
            showCancelButton: false,
          });
        } else {
          error({
            title: "Could not delete question",
            message: res.error?.message || "An unexpected error occurred",
            showCancelButton: false,
            confirmText: "Close",
          });
        }
      },
    });
  };

  const handleDeleteGroup = async (groupId?: number) => {
    if (!groupId) return;

    warning({
      title: "Delete question group",
      message: "Are you sure you want to delete this group?",
      description: "Nested questions should be removed by backend cascade if configured",
      confirmText: "Delete",
      cancelText: "Cancel",
      showCancelButton: true,
      onConfirm: async () => {
        const res = await adminApi.deleteQuestionGroup({ id: groupId });
        if (res.success) {
          await onReload();
          success({
            title: "Success",
            message: "Question group deleted successfully",
            autoClose: true,
            showCancelButton: false,
          });
        } else {
          error({
            title: "Could not delete group",
            message: res.error?.message || "An unexpected error occurred",
            showCancelButton: false,
            confirmText: "Close",
          });
        }
      },
    });
  };

  const isCreateMode =
    dialogMode === "create-single" || dialogMode === "create-group";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[720px] overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[#155ca5] mb-1">
            <HelpCircle className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wide">
              Question panel
            </span>
          </div>

          <h2 className="text-xl font-bold text-slate-900">
            {selectedLesson ? selectedLesson.name : "No lesson selected"}
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            {selectedLesson
              ? "Showing single questions and question groups for this lesson"
              : "Select a lesson to view questions"}
          </p>
        </div>

        {selectedLesson && (
          <div className="flex items-center gap-3">
            <input
              ref={importInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImportExcel}
            />

            <Button
              variant="outline"
              onClick={() => importInputRef.current?.click()}
              disabled={submitting}
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Excel
            </Button>

            <Button variant="outline" asChild>
              <Link
                to={`/lessons/${selectedLesson.id}?preview=admin`}
                target="_blank"
                rel="noreferrer"
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                Preview Lesson
              </Link>
            </Button>

            <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-right">
              <p className="text-xs text-slate-500">Total</p>
              <p className="text-lg font-bold text-slate-900">
                {normalized.totalQuestions}
              </p>
            </div>

            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add question
            </Button>
          </div>
        )}
      </div>

      {!selectedLesson ? (
        <div className="flex items-center justify-center min-h-[500px] p-8 text-center">
          <div className="max-w-md">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-700 font-semibold">
              No lesson selected
            </p>
            <p className="text-sm text-slate-500 mt-2">
              After you select a lesson, single questions and question groups will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-5 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold text-[#155ca5] uppercase tracking-wide">
              Lesson info
            </p>
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Lesson ID</p>
                <p className="font-semibold text-slate-900">{selectedLesson.id}</p>
              </div>
              <div>
                <p className="text-slate-500">Order</p>
                <p className="font-semibold text-slate-900">
                  {selectedLesson.lessonNumber ?? selectedLesson.orderIndex ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Skill</p>
                <p className="font-semibold text-slate-900">
                  {selectedLesson.skillType ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Duration</p>
                <p className="font-semibold text-slate-900">
                  {selectedLesson.durationMinutes ?? "-"} minutes
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3">
              <p className="text-lg font-bold text-slate-900">
                Single Questions ({normalized.singleQuestions.length})
              </p>
              <p className="text-sm text-slate-500">
                Standalone questions in this lesson
              </p>
            </div>

            {normalized.singleQuestions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-700 font-semibold">
                  No standalone questions yet
                </p>
              </div>
            ) : (
              <div className="max-h-[420px] overflow-y-auto pr-2 space-y-3">
                {normalized.singleQuestions.map((question, index) => (
                  <div
                    key={`single-question-${question.id ?? index}`}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-[11px] px-2 py-1 rounded-full bg-[#155ca5]/10 text-[#155ca5] font-bold">
                            QUESTION {index + 1}
                          </span>
                          <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold">
                            {question.questionType}
                          </span>
                          <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                            ID: {question.id}
                          </span>
                        </div>

                        <div className="max-h-[140px] overflow-y-auto pr-1">
                          <p className="question-text-unified text-slate-900 whitespace-pre-wrap break-words">
                            {question.content}
                          </p>

                          {question.instruction && (
                            <p className="text-xs text-slate-500 mt-2 whitespace-pre-wrap break-words">
                              Instruction: {question.instruction}
                            </p>
                          )}

                          {question.hint && (
                            <p className="text-xs text-amber-700 mt-2 whitespace-pre-wrap break-words">
                              Hint: {question.hint}
                            </p>
                          )}

                          {question.correctAnswer && (
                            <p className="text-xs text-emerald-600 mt-2 font-medium whitespace-pre-wrap break-words">
                              Correct answer: {question.correctAnswer}
                            </p>
                          )}

                          {question.explanation && (
                            <p className="text-xs text-slate-500 mt-2 whitespace-pre-wrap break-words">
                              Explanation: {question.explanation}
                            </p>
                          )}
                        </div>

                        {Array.isArray(question.options) &&
                          question.options.length > 0 && (
                            <div className="mt-3 max-h-[180px] overflow-y-auto pr-1 space-y-2">
                              {question.options.map((option, optionIndex) => (
                                <div
                                  key={`single-option-${question.id}-${option.id ?? optionIndex}`}
                                  className={`text-sm rounded-lg px-3 py-2 border ${option.isCorrect
                                      ? "bg-green-50 border-green-200 text-green-800"
                                      : "bg-slate-50 border-slate-200 text-slate-700"
                                    }`}
                                >
                                  <span className="font-semibold mr-2">
                                    {option.optionKey || OPTION_KEYS[optionIndex]}.
                                  </span>
                                  <span className="break-words whitespace-pre-wrap">
                                    {option.content}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditSingleDialog(question)}
                          className="p-2 rounded-lg hover:bg-slate-100"
                          type="button"
                        >
                          <Pencil className="w-4 h-4 text-slate-700" />
                        </button>

                        <button
                          onClick={() => void handleDeleteSingleQuestion(question.id)}
                          className="p-2 rounded-lg hover:bg-red-50"
                          type="button"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-3">
              <p className="text-lg font-bold text-slate-900">
                Question Groups ({normalized.questionGroups.length})
              </p>
              <p className="text-sm text-slate-500">
                Question groups with shared content
              </p>
            </div>

            {normalized.questionGroups.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                <Layers3 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-700 font-semibold">
                  No question groups yet
                </p>
              </div>
            ) : (
              <div className="max-h-[520px] overflow-y-auto pr-2 space-y-4">
                {normalized.questionGroups.map((group, groupIndex) => {
                  const isExpanded = Boolean(group.id && expandedGroups[group.id]);

                  return (
                    <div
                      key={`group-${group.id ?? groupIndex}`}
                      className="rounded-xl border border-slate-200 overflow-hidden"
                    >
                      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => toggleGroup(group.id)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-500" />
                            )}
                            <span className="text-[11px] px-2 py-1 rounded-full bg-[#155ca5]/10 text-[#155ca5] font-bold">
                              GROUP {groupIndex + 1}
                            </span>
                            <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold">
                              {group.groupType}
                            </span>
                            <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                              ID: {group.id}
                            </span>
                          </div>

                          <p className="text-base font-bold text-slate-900 break-words">
                            {group.title || "Untitled group"}
                          </p>

                          {group.instruction && (
                            <p className="text-sm text-slate-500 mt-1 break-words whitespace-pre-wrap line-clamp-2">
                              {group.instruction}
                            </p>
                          )}
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditGroupDialog(group)}
                            className="p-2 rounded-lg hover:bg-slate-100"
                            type="button"
                          >
                            <Pencil className="w-4 h-4 text-slate-700" />
                          </button>

                          <button
                            onClick={() => void handleDeleteGroup(group.id)}
                            className="p-2 rounded-lg hover:bg-red-50"
                            type="button"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 space-y-4 max-h-[420px] overflow-y-auto">
                          {group.sharedContent && (
                            <div className="rounded-lg border border-slate-200 p-3 bg-white">
                              <p className="text-xs font-bold text-slate-500 mb-2 uppercase">
                                Shared content
                              </p>
                              <div className="max-h-[160px] overflow-y-auto pr-1">
                                <p className="text-sm text-slate-800 whitespace-pre-wrap break-words">
                                  {group.sharedContent}
                                </p>
                              </div>
                            </div>
                          )}

                          {group.audioUrl && (
                            <div className="rounded-lg border border-slate-200 p-3 bg-white space-y-2">
                              <p className="text-xs font-bold text-slate-500 uppercase">
                                Group audio
                              </p>
                              <audio
                                controls
                                preload="none"
                                src={group.audioUrl}
                                className="w-full"
                              />
                            </div>
                          )}

                          <div className="space-y-3">
                            {(group.questions || []).map((question, qIndex) => (
                              <div
                                key={`group-question-${group.id}-${question.id ?? qIndex}`}
                                className="rounded-lg border border-slate-200 p-4"
                              >
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-700 font-bold">
                                    Question {qIndex + 1}
                                  </span>
                                  <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                                    {question.questionType}
                                  </span>
                                  <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                                    ID: {question.id}
                                  </span>
                                </div>

                                <div className="max-h-[140px] overflow-y-auto pr-1">
                                  <p className="question-text-unified text-slate-900 whitespace-pre-wrap break-words">
                                    {question.content}
                                  </p>

                                  {question.instruction && (
                                    <p className="text-xs text-slate-500 mt-2 whitespace-pre-wrap break-words">
                                      Instruction: {question.instruction}
                                    </p>
                                  )}

                                  {question.hint && (
                                    <p className="text-xs text-amber-700 mt-2 whitespace-pre-wrap break-words">
                                      Hint: {question.hint}
                                    </p>
                                  )}

                                  {question.audioUrl && (
                                    <div className="mt-3">
                                      <audio
                                        controls
                                        preload="none"
                                        src={question.audioUrl}
                                        className="w-full"
                                      />
                                    </div>
                                  )}

                                  {question.correctAnswer && (
                                    <p className="text-xs text-emerald-600 mt-2 font-medium whitespace-pre-wrap break-words">
                                      Correct answer: {question.correctAnswer}
                                    </p>
                                  )}
                                </div>

                                {Array.isArray(question.options) &&
                                  question.options.length > 0 && (
                                    <div className="mt-3 max-h-[180px] overflow-y-auto pr-1 space-y-2">
                                      {question.options.map((option, optionIndex) => (
                                        <div
                                          key={`group-option-${question.id}-${option.id ?? optionIndex}`}
                                          className={`text-sm rounded-lg px-3 py-2 border ${option.isCorrect
                                              ? "bg-green-50 border-green-200 text-green-800"
                                              : "bg-slate-50 border-slate-200 text-slate-700"
                                            }`}
                                        >
                                          <span className="font-semibold mr-2">
                                            {option.optionKey ||
                                              OPTION_KEYS[optionIndex]}
                                            .
                                          </span>
                                          <span className="break-words whitespace-pre-wrap">
                                            {option.content}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetAll();
        }}
      >
        <DialogContent
          className="max-w-5xl max-h-[90vh] overflow-y-auto"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "edit-single" && "Edit question"}
              {dialogMode === "edit-group" && "Edit question group"}
              {dialogMode === "create-single" && "Add question"}
              {dialogMode === "create-group" && "Add question group"}
              {!dialogMode && "Add Question"}
            </DialogTitle>
          </DialogHeader>

          {step === 1 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm">
                <span className="text-slate-500">Selected lesson: </span>
                <span className="font-semibold text-slate-900">
                  {selectedLesson?.name || "Not selected"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setDialogMode("create-single");
                    setSelectedGroupType("");
                  }}
                  className={`rounded-xl border p-5 text-left transition ${dialogMode === "create-single"
                      ? "border-[#155ca5] bg-[#155ca5]/5"
                      : "border-slate-200 hover:border-slate-300"
                    }`}
                >
                  <p className="font-bold text-slate-900">Single question</p>
                  <p className="text-sm text-slate-500 mt-1">
                    A standalone question that can have its own options
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDialogMode("create-group");
                    setSelectedSingleType("");
                  }}
                  className={`rounded-xl border p-5 text-left transition ${dialogMode === "create-group"
                      ? "border-[#155ca5] bg-[#155ca5]/5"
                      : "border-slate-200 hover:border-slate-300"
                    }`}
                >
                  <p className="font-bold text-slate-900">Question group</p>
                  <p className="text-sm text-slate-500 mt-1">
                    A group with shared passage/content and multiple child questions
                  </p>
                </button>
              </div>
            </div>
          )}

          {step === 2 && dialogMode === "create-single" && (
            <div className="space-y-4">
              <p className="font-semibold text-slate-900">Choose question type</p>
              <div className="grid grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-2">
                {SINGLE_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedSingleType(type)}
                    className={`rounded-lg border px-4 py-3 text-left text-sm transition ${selectedSingleType === type
                        ? "border-[#155ca5] bg-[#155ca5]/5 text-[#155ca5]"
                        : "border-slate-200 hover:border-slate-300"
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && dialogMode === "create-group" && (
            <div className="space-y-4">
              <p className="font-semibold text-slate-900">Choose group type</p>
              <div className="grid grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-2">
                {GROUP_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedGroupType(type)}
                    className={`rounded-lg border px-4 py-3 text-left text-sm transition ${selectedGroupType === type
                        ? "border-[#155ca5] bg-[#155ca5]/5 text-[#155ca5]"
                        : "border-slate-200 hover:border-slate-300"
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 &&
            (dialogMode === "create-single" || dialogMode === "edit-single") && (
              <div className="space-y-5">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm">
                    <span className="text-slate-500">Question type: </span>
                    <span className="font-semibold text-slate-900">
                      {selectedSingleType}
                    </span>
                  </p>
                </div>

                <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Content</label>
                    <Textarea
                      rows={4}
                      value={singleForm.content}
                      onChange={(e) =>
                        setSingleForm((prev) => ({
                          ...prev,
                          content: e.target.value,
                        }))
                      }
                      placeholder="Enter question content"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Instruction</label>
                    <Textarea
                      rows={2}
                      value={singleForm.instruction}
                      onChange={(e) =>
                        setSingleForm((prev) => ({
                          ...prev,
                          instruction: e.target.value,
                        }))
                      }
                      placeholder="Example: Choose the correct answer"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Hint</label>
                    <Textarea
                      rows={3}
                      value={singleForm.hint}
                      onChange={(e) =>
                        setSingleForm((prev) => ({
                          ...prev,
                          hint: e.target.value,
                        }))
                      }
                      placeholder="Enter a hint for students, such as key ideas or how to approach the task"
                    />
                  </div>

                  {supportsSingleAudio(selectedSingleType) && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Audio file</label>
                      <Input
                        value={singleForm.existingAudioUrl || ""}
                        onChange={(e) =>
                          setSingleForm((prev) => ({
                            ...prev,
                            existingAudioUrl: e.target.value,
                          }))
                        }
                        placeholder="Paste an audio URL (https://...) if available"
                      />
                      {singleForm.existingAudioUrl && (
                        <>
                          <p className="text-xs text-slate-500 break-all">
                            Current: {singleForm.existingAudioUrl}
                          </p>
                          <audio
                            controls
                            preload="none"
                            src={singleForm.existingAudioUrl}
                            className="w-full"
                          />
                        </>
                      )}
                      <Input
                        type="file"
                        accept="audio/*"
                        onChange={(e) =>
                          setSingleForm((prev) => ({
                            ...prev,
                            audioFile: e.target.files?.[0] || null,
                          }))
                        }
                      />
                    </div>
                  )}

                  {supportsSingleImage(selectedSingleType) && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Image file</label>
                      {singleForm.existingImageUrl && (
                        <p className="text-xs text-slate-500 break-all">
                          Current: {singleForm.existingImageUrl}
                        </p>
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setSingleForm((prev) => ({
                            ...prev,
                            imageFile: e.target.files?.[0] || null,
                          }))
                        }
                      />
                    </div>
                  )}

                  {isMatchingType(selectedSingleType) ? (
                    <MatchingEditor
                      questionData={singleForm.questionData}
                      correctAnswer={singleForm.correctAnswer}
                      onChange={(next) =>
                        setSingleForm((prev) => ({
                          ...prev,
                          questionData: next.questionData,
                          correctAnswer: next.correctAnswer,
                        }))
                      }
                    />
                  ) : shouldShowQuestionData(selectedSingleType) && (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">
                          {getQuestionDataFieldMeta(selectedSingleType).label}
                        </label>
                        <p className="text-xs text-slate-500">
                          This value is stored directly in the backend `question_data` column as TEXT.
                        </p>
                      </div>
                      <Textarea
                        rows={3}
                        value={singleForm.questionData}
                        onChange={(e) =>
                          setSingleForm((prev) => ({
                            ...prev,
                            questionData: e.target.value,
                          }))
                        }
                        placeholder={getQuestionDataFieldMeta(selectedSingleType).placeholder}
                      />
                    </div>
                  )}

                  {(isTextAnswerType(selectedSingleType) || isMatchingType(selectedSingleType)) &&
                    !isMatchingType(selectedSingleType) && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Correct Answer</label>
                      <Input
                        value={singleForm.correctAnswer}
                        onChange={(e) =>
                          setSingleForm((prev) => ({
                            ...prev,
                            correctAnswer: e.target.value,
                          }))
                        }
                        placeholder="Enter the correct answer"
                      />
                    </div>
                  )}

                  {isTrueFalseType(selectedSingleType) && (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          True / False / Not Given
                        </p>
                        <p className="text-xs text-slate-500">
                          This type uses 3 fixed choices. You only need to select the correct answer.
                        </p>
                      </div>
                      <div className="space-y-3">
                        {singleForm.options.map((option, index) => (
                          <label
                            key={`single-true-false-${option.optionKey}-${index}`}
                            className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-500">
                                {option.optionKey}
                              </p>
                              <p className="font-semibold text-slate-900">{option.content}</p>
                            </div>
                            <span className="flex items-center gap-2 text-sm">
                              <input
                                type="radio"
                                name="single-true-false-correct-option"
                                checked={option.isCorrect}
                                onChange={() =>
                                  updateSingleOption(index, "isCorrect", true)
                                }
                              />
                              Correct
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {isOptionBasedType(selectedSingleType) &&
                    !isMatchingType(selectedSingleType) &&
                    !isTrueFalseType(selectedSingleType) && (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-slate-900">Options</p>
                      <div className="max-h-[260px] overflow-y-auto pr-1 space-y-3">
                        {singleForm.options.map((option, index) => (
                          <div
                            key={`single-form-option-${index}`}
                            className="rounded-lg border border-slate-200 p-3 grid grid-cols-12 gap-3 items-center"
                          >
                            <div className="col-span-1 text-sm font-bold text-slate-700">
                              {option.optionKey}
                            </div>

                            <div className="col-span-9">
                              <Input
                                value={option.content}
                                onChange={(e) =>
                                  updateSingleOption(index, "content", e.target.value)
                                }
                                placeholder={`Enter option ${option.optionKey}`}
                              />
                            </div>

                            <label className="col-span-2 flex items-center justify-end gap-2 text-sm">
                              <input
                                type="radio"
                                name="single-correct-option"
                                checked={option.isCorrect}
                                onChange={() =>
                                  updateSingleOption(index, "isCorrect", true)
                                }
                              />
                              Correct
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          {step === 3 &&
            (dialogMode === "create-group" || dialogMode === "edit-group") && (
              <div className="space-y-5">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm">
                    <span className="text-slate-500">Group type: </span>
                    <span className="font-semibold text-slate-900">
                      {selectedGroupType}
                    </span>
                  </p>
                </div>

                <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Group Title</label>
                    <Input
                      value={groupForm.title}
                      onChange={(e) =>
                        setGroupForm((prev) => ({ ...prev, title: e.target.value }))
                      }
                      placeholder="Example: Read the passage"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Group Instruction</label>
                    <Textarea
                      rows={2}
                      value={groupForm.instruction}
                      onChange={(e) =>
                        setGroupForm((prev) => ({
                          ...prev,
                          instruction: e.target.value,
                        }))
                      }
                      placeholder="Example: Read the passage and answer the questions"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Shared Content</label>
                    <p className="hidden">
                      Dá»‹nh dáº¡ng nhanh: <span className="font-semibold">**text**</span> hoáº·c{" "}
                      <span className="font-semibold">&lt;b&gt;text&lt;/b&gt;</span> Ä‘á»ƒ in Ä‘áº­m;
                      {" "}
                      <span className="font-semibold">[[text]]</span> hoáº·c{" "}
                      <span className="font-semibold">__text__</span> Ä‘á»ƒ gáº¡ch chÃ¢n. Muá»‘n Ä‘áº·t
                      Ã´ chá»n ngay trong passage thÃ¬ nháº­p{" "}
                      <span className="font-semibold">(1)[A|B|C|D]</span> ngay Ä‘Ãºng vá»‹ trÃ­ admin
                      muá»‘n hiá»‡n.
                    </p>
                    <p className="text-xs leading-5 text-slate-500">
                      Quick formatting: use <span className="font-semibold">**text**</span> or{" "}
                      <span className="font-semibold">&lt;b&gt;text&lt;/b&gt;</span> for bold. Use{" "}
                      <span className="font-semibold">[[text]]</span> or{" "}
                      <span className="font-semibold">__text__</span> for underline. To place an inline choice in the
                      passage, enter <span className="font-semibold">(1)[A|B|C|D]</span> at the exact position where it
                      should appear.
                    </p>
                    <Textarea
                      rows={6}
                      value={groupForm.sharedContent}
                      onChange={(e) =>
                        setGroupForm((prev) => ({
                          ...prev,
                          sharedContent: e.target.value,
                        }))
                      }
                      placeholder="Shared passage / transcript / prompt for the whole group"
                    />
                  </div>

                  {supportsGroupAudio(selectedGroupType) && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Audio file</label>
                      <Input
                        value={groupForm.existingAudioUrl || ""}
                        onChange={(e) =>
                          setGroupForm((prev) => ({
                            ...prev,
                            existingAudioUrl: e.target.value,
                          }))
                        }
                        placeholder="Paste an audio URL (https://...) if available"
                      />
                      {groupForm.existingAudioUrl && (
                        <>
                          <p className="text-xs text-slate-500 break-all">
                            Current: {groupForm.existingAudioUrl}
                          </p>
                          <audio
                            controls
                            preload="none"
                            src={groupForm.existingAudioUrl}
                            className="w-full"
                          />
                        </>
                      )}
                      <Input
                        type="file"
                        accept="audio/*"
                        onChange={(e) =>
                          setGroupForm((prev) => ({
                            ...prev,
                            audioFile: e.target.files?.[0] || null,
                          }))
                        }
                      />
                    </div>
                  )}

                  {supportsGroupImage(selectedGroupType) && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Image file</label>
                      {groupForm.existingImageUrl && (
                        <p className="text-xs text-slate-500 break-all">
                          Current: {groupForm.existingImageUrl}
                        </p>
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setGroupForm((prev) => ({
                            ...prev,
                            imageFile: e.target.files?.[0] || null,
                          }))
                        }
                      />
                    </div>
                  )}

                  {shouldShowGroupData(selectedGroupType) && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Group Data</label>
                      <Textarea
                        rows={3}
                        value={groupForm.groupData}
                        onChange={(e) =>
                          setGroupForm((prev) => ({
                            ...prev,
                            groupData: e.target.value,
                          }))
                        }
                        placeholder={
                          selectedGroupType === "WORD_BANK"
                            ? 'Example: {"wordBank":["because","although","however"]}'
                            : "Optional JSON/string if this group needs custom data"
                        }
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">Questions in group</p>
                      <p className="text-sm text-slate-500">
                        Create child questions inside this group
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAllEditorQuestionsExpanded(false)}
                      >
                        Collapse all
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAllEditorQuestionsExpanded(true)}
                      >
                        Expand all
                      </Button>
                      <Button type="button" variant="outline" onClick={addChildQuestion}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add child question
                      </Button>
                    </div>
                  </div>

                  <div className="max-h-[420px] overflow-y-auto pr-1 space-y-4">
                    {groupForm.questions.map((question, qIndex) => {
                      const childType = getDefaultChildType(selectedGroupType);
                      const isExpanded = expandedEditorQuestions[qIndex] !== false;

                      return (
                        <div
                          key={`group-form-question-${qIndex}`}
                          className="rounded-xl border border-slate-200 p-4 space-y-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => toggleEditorQuestion(qIndex)}
                              className="min-w-0 flex-1 text-left"
                            >
                              <div className="flex items-center gap-2">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-slate-500" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-slate-500" />
                                )}
                                <p className="font-bold text-slate-900">
                                  Question {qIndex + 1}
                                </p>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                Child type: {childType}
                              </p>
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleEditorQuestion(qIndex)}
                              className="text-sm text-slate-500 hover:text-slate-700"
                            >
                              {isExpanded ? "Collapse" : "Expand"}
                            </button>

                            {groupForm.questions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeChildQuestion(qIndex)}
                                className="text-sm text-red-600 hover:text-red-700"
                              >
                                Remove this question
                              </button>
                            )}
                          </div>

                          {isExpanded && (
                            <>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Content</label>
                            <p className="hidden">
                              HÃ´ trá»£ in Ä‘áº­m báº±ng <span className="font-semibold">**text**</span>
                              {" "}
                              hoáº·c <span className="font-semibold">&lt;b&gt;text&lt;/b&gt;</span>.
                              Dá»‹nh dáº¡ng gáº¡ch chÃ¢n dÃ¹ng{" "}
                              <span className="font-semibold">[[text]]</span>,{" "}
                              <span className="font-semibold">__text__</span> hoáº·c{" "}
                              <span className="font-semibold">&lt;u&gt;text&lt;/u&gt;</span>.
                            </p>
                            <p className="text-xs leading-5 text-slate-500">
                              Bold is supported with <span className="font-semibold">**text**</span> or{" "}
                              <span className="font-semibold">&lt;b&gt;text&lt;/b&gt;</span>. Underline is supported with{" "}
                              <span className="font-semibold">[[text]]</span>,{" "}
                              <span className="font-semibold">__text__</span>, or{" "}
                              <span className="font-semibold">&lt;u&gt;text&lt;/u&gt;</span>.
                            </p>
                            <Textarea
                              rows={3}
                              value={question.content}
                              onChange={(e) =>
                                updateGroupQuestion(qIndex, "content", e.target.value)
                              }
                              placeholder="Child question content"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Instruction</label>
                            <Textarea
                              rows={2}
                              value={question.instruction}
                              onChange={(e) =>
                                updateGroupQuestion(
                                  qIndex,
                                  "instruction",
                                  e.target.value,
                                )
                              }
                              placeholder="Optional instruction for this question"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Hint</label>
                            <Textarea
                              rows={3}
                              value={question.hint}
                              onChange={(e) =>
                                updateGroupQuestion(qIndex, "hint", e.target.value)
                              }
                              placeholder="Enter a hint specific to this question"
                            />
                          </div>

                          {isMatchingType(childType) ? (
                            <MatchingEditor
                              questionData={question.questionData}
                              correctAnswer={question.correctAnswer}
                              onChange={(next) => {
                                updateGroupQuestion(qIndex, "questionData", next.questionData);
                                updateGroupQuestion(qIndex, "correctAnswer", next.correctAnswer);
                              }}
                            />
                          ) : shouldShowQuestionData(childType) && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                {getQuestionDataFieldMeta(childType).label}
                              </label>
                              <Textarea
                                rows={2}
                                value={question.questionData}
                                onChange={(e) =>
                                  updateGroupQuestion(
                                    qIndex,
                                    "questionData",
                                    e.target.value,
                                  )
                                }
                                placeholder={getQuestionDataFieldMeta(childType).placeholder}
                              />
                            </div>
                          )}

                          {shouldShowExplanation(childType) && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Explanation</label>
                              <Textarea
                                rows={2}
                                value={question.explanation}
                                onChange={(e) =>
                                  updateGroupQuestion(
                                    qIndex,
                                    "explanation",
                                    e.target.value,
                                  )
                                }
                                placeholder="Explain the answer"
                              />
                            </div>
                          )}

                          {(isTextAnswerType(childType) || isMatchingType(childType)) &&
                            !isMatchingType(childType) && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                Correct Answer
                              </label>
                              <Input
                                value={question.correctAnswer}
                                onChange={(e) =>
                                  updateGroupQuestion(
                                    qIndex,
                                    "correctAnswer",
                                    e.target.value,
                                  )
                                }
                                placeholder="Answer / expected answer / rubric"
                              />
                            </div>
                          )}

                          {isOptionBasedType(childType) && !isMatchingType(childType) && (
                            <div className="space-y-3">
                              <p className="text-sm font-semibold text-slate-900">
                                Options
                              </p>
                              <div className="max-h-[220px] overflow-y-auto pr-1 space-y-3">
                                {question.options.map((option, oIndex) => (
                                  <div
                                    key={`group-form-option-${qIndex}-${oIndex}`}
                                    className="rounded-lg border border-slate-200 p-3 grid grid-cols-12 gap-3 items-center"
                                  >
                                    <div className="col-span-1 text-sm font-bold text-slate-700">
                                      {option.optionKey}
                                    </div>

                                    <div className="col-span-9">
                                      <Input
                                        value={option.content}
                                        onChange={(e) =>
                                          updateGroupOption(
                                            qIndex,
                                            oIndex,
                                            "content",
                                            e.target.value,
                                          )
                                        }
                                        placeholder={`Enter option ${option.optionKey}`}
                                      />
                                    </div>

                                    <label className="col-span-2 flex items-center justify-end gap-2 text-sm">
                                      <input
                                        type="radio"
                                        name={`group-correct-option-${qIndex}`}
                                        checked={option.isCorrect}
                                        onChange={() =>
                                          updateGroupOption(
                                            qIndex,
                                            oIndex,
                                            "isCorrect",
                                            true,
                                          )
                                        }
                                      />
                                      Correct
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          <DialogFooter>
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                {step > 1 && isCreateMode && (
                  <Button
                    variant="outline"
                    onClick={() => setStep((prev) => (prev - 1) as WizardStep)}
                    disabled={submitting}
                  >
                    Back
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>

                {step < 3 && isCreateMode ? (
                  <Button
                    onClick={() => {
                      if (step === 1 && !dialogMode) return;
                      if (
                        step === 2 &&
                        dialogMode === "create-single" &&
                        !selectedSingleType
                      ) {
                        return;
                      }
                      if (
                        step === 2 &&
                        dialogMode === "create-group" &&
                        !selectedGroupType
                      ) {
                        return;
                      }
                      setStep((prev) => (prev + 1) as WizardStep);
                    }}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    onClick={() =>
                      void (
                        dialogMode === "create-single" ||
                          dialogMode === "edit-single"
                          ? handleSubmitSingle()
                          : handleSubmitGroup()
                      )
                    }
                    disabled={submitting}
                  >
                    {submitting && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {dialogMode === "edit-single" && "Update question"}
                    {dialogMode === "edit-group" && "Update question group"}
                    {dialogMode === "create-single" && "Create question"}
                    {dialogMode === "create-group" && "Create question group"}
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NotificationPopup {...notification} onClose={close} />
    </div>
  );
}




