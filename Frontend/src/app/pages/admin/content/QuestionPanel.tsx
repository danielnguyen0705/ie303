import { useMemo, useRef, useState } from "react";
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
  content?: string;
  instruction?: string;
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
  "MATCHING",
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

function createDefaultOptions(): QuestionOptionItem[] {
  return OPTION_KEYS.map((key) => ({
    optionKey: key,
    content: "",
    isCorrect: false,
  }));
}

function createEmptySingleForm(): SingleFormState {
  return {
    content: "",
    instruction: "",
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
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctOption?: string;
}) {
  const correctOption = String(row.correctOption || "")
    .trim()
    .toUpperCase();

  return OPTION_KEYS.map((key) => ({
    optionKey: key,
    content: String(
      row[
        `option${key}` as "optionA" | "optionB" | "optionC" | "optionD"
      ] || "",
    ).trim(),
    isCorrect: correctOption === key,
  }));
}

function mapQuestionToSingleForm(question: QuestionItem): SingleFormState {
  const options =
    Array.isArray(question.options) && question.options.length > 0
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
  const options =
    Array.isArray(question.options) && question.options.length > 0
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

  const normalized = useMemo(
    () => normalizePayload(questionsPayload),
    [questionsPayload],
  );

  const resetAll = () => {
    setStep(1);
    setDialogMode(null);
    setSelectedSingleType("");
    setSelectedGroupType("");
    setSubmitting(false);
    setSingleForm(createEmptySingleForm());
    setGroupForm(createEmptyGroupForm());
  };

  const openCreateDialog = () => {
    if (!selectedLesson) {
      error({
        title: "Chưa chọn lesson",
        message: "Bạn cần chọn lesson trước khi thêm question",
        showCancelButton: false,
        confirmText: "Đóng",
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

  const updateGroupQuestionFile = (
    qIndex: number,
    field: "audioFile" | "imageFile",
    file: File | null,
  ) => {
    setGroupForm((prev) => {
      const next = [...prev.questions];
      next[qIndex] = { ...next[qIndex], [field]: file };
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
    setGroupForm((prev) => ({
      ...prev,
      questions: [...prev.questions, createEmptyGroupChild()],
    }));
  };

  const removeChildQuestion = (index: number) => {
    setGroupForm((prev) => {
      if (prev.questions.length <= 1) return prev;
      return {
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index),
      };
    });
  };

  const validateSingle = () => {
    if (!selectedLesson?.id) return "Thiếu lessonId";
    if (!selectedSingleType) return "Bạn chưa chọn loại câu hỏi";
    if (!singleForm.content.trim()) return "Content không được để trống";

    if (isOptionBasedType(selectedSingleType)) {
      const emptyOption = singleForm.options.find((opt) => !opt.content.trim());
      if (emptyOption) return "Các option không được để trống";

      const hasCorrect = singleForm.options.some((opt) => opt.isCorrect);
      if (!hasCorrect) return "Bạn cần chọn 1 đáp án đúng";
    }

    if (
      isTextAnswerType(selectedSingleType) &&
      !singleForm.correctAnswer.trim()
    ) {
      return "Correct answer không được để trống";
    }

    return null;
  };

  const validateGroup = () => {
    if (!selectedLesson?.id) return "Thiếu lessonId";
    if (!selectedGroupType) return "Bạn chưa chọn loại group";
    if (!groupForm.title.trim()) return "Title group không được để trống";

    const childType = getDefaultChildType(selectedGroupType);

    for (let i = 0; i < groupForm.questions.length; i += 1) {
      const q = groupForm.questions[i];

      if (!q.content.trim()) {
        return `Question ${i + 1}: content không được để trống`;
      }

      if (isOptionBasedType(childType)) {
        const emptyOption = q.options.find((opt) => !opt.content.trim());
        if (emptyOption) {
          return `Question ${i + 1}: option không được để trống`;
        }

        const hasCorrect = q.options.some((opt) => opt.isCorrect);
        if (!hasCorrect) {
          return `Question ${i + 1}: cần chọn 1 đáp án đúng`;
        }
      }

      if (isTextAnswerType(childType) && !q.correctAnswer.trim()) {
        return `Question ${i + 1}: correct answer không được để trống`;
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
            optionRes.error?.message || `Không thể cập nhật option ${i + 1}`,
          );
        }
      } else {
        const optionRes = await adminApi.createQuestionOption(payload);

        if (!optionRes.success) {
          throw new Error(
            optionRes.error?.message || `Không thể tạo option ${i + 1}`,
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
          questionData: String(row.questionData || "").trim() || undefined,
          explanation: String(row.explanation || "").trim() || undefined,
          correctAnswer: isTextAnswerType(questionType)
            ? String(row.correctAnswer || "").trim() || undefined
            : undefined,
          questionGroupId: null,
        });

        if (!createRes.success || !createRes.data?.id) {
          throw new Error(createRes.error?.message || "Import single question thất bại");
        }

        if (isOptionBasedType(questionType)) {
          const options = buildOptionsFromExcelRow(row);
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
          throw new Error(groupRes.error?.message || "Import group thất bại");
        }

        const childType = getDefaultChildType(groupType);
        const children = groupQuestionRows.filter(
          (row) => String(row.groupKey || "").trim() === groupKey,
        );

        for (const child of children) {
          const content = String(child.content || "").trim();
          if (!content) continue;

          const questionRes = await adminApi.createContentQuestion({
            lessonId: selectedLesson.id,
            questionType: childType as never,
            content,
            instruction: String(child.instruction || "").trim() || undefined,
            questionData: String(child.questionData || "").trim() || undefined,
            explanation: String(child.explanation || "").trim() || undefined,
            correctAnswer: isTextAnswerType(childType)
              ? String(child.correctAnswer || "").trim() || undefined
              : undefined,
            questionGroupId: groupRes.data.id,
          });

          if (!questionRes.success || !questionRes.data?.id) {
            throw new Error(
              questionRes.error?.message || "Import child question thất bại",
            );
          }

          if (isOptionBasedType(childType)) {
            const options = buildOptionsFromExcelRow(child);
            await upsertQuestionOptions(questionRes.data.id, options);
          }
        }
      }

      await onReload();

      success({
        title: "Thành công",
        message: "Đã import Excel",
        autoClose: true,
        showCancelButton: false,
      });
    } catch (e: any) {
      error({
        title: "Import Excel thất bại",
        message:
          e?.message ||
          "Hãy kiểm tra lại tên sheet: single_questions, question_groups, group_questions",
        showCancelButton: false,
        confirmText: "Đóng",
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
        title: "Thiếu thông tin",
        message: validationError,
        showCancelButton: false,
        confirmText: "Đóng",
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
        audioUrl: supportsSingleAudio(selectedSingleType)
          ? singleForm.audioFile || undefined
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
            (isEditing ? "Không thể cập nhật question" : "Không thể tạo question"),
        );
      }

      if (isOptionBasedType(selectedSingleType)) {
        await upsertQuestionOptions(questionRes.data.id, singleForm.options);
      }

      setIsDialogOpen(false);
      resetAll();
      await onReload();

      success({
        title: "Thành công",
        message: isEditing ? "Đã cập nhật question" : "Đã tạo question",
        autoClose: true,
        showCancelButton: false,
      });
    } catch (e: any) {
      error({
        title:
          dialogMode === "edit-single"
            ? "Cập nhật question thất bại"
            : "Tạo question thất bại",
        message: e?.message || "Đã có lỗi xảy ra",
        showCancelButton: false,
        confirmText: "Đóng",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitGroup = async () => {
    const validationError = validateGroup();
    if (validationError) {
      error({
        title: "Thiếu thông tin",
        message: validationError,
        showCancelButton: false,
        confirmText: "Đóng",
      });
      return;
    }

    try {
      setSubmitting(true);

      const isEditing = dialogMode === "edit-group" && !!groupForm.id;

      const groupRes = isEditing
        ? await adminApi.updateQuestionGroup({
            groupId: groupForm.id!,
            data: {
              lessonId: selectedLesson!.id,
              groupType: selectedGroupType as never,
              title: groupForm.title.trim(),
              instruction: groupForm.instruction.trim() || undefined,
              sharedContent: groupForm.sharedContent.trim() || undefined,
              audioUrl: supportsGroupAudio(selectedGroupType)
                ? groupForm.audioFile || undefined
                : undefined,
              imageUrl: supportsGroupImage(selectedGroupType)
                ? groupForm.imageFile || undefined
                : undefined,
              groupData: groupForm.groupData.trim() || undefined,
            },
          })
        : await adminApi.createQuestionGroup({
            lessonId: selectedLesson!.id,
            groupType: selectedGroupType as never,
            title: groupForm.title.trim(),
            instruction: groupForm.instruction.trim() || undefined,
            sharedContent: groupForm.sharedContent.trim() || undefined,
            audioUrl: supportsGroupAudio(selectedGroupType)
              ? groupForm.audioFile || undefined
              : undefined,
            imageUrl: supportsGroupImage(selectedGroupType)
              ? groupForm.imageFile || undefined
              : undefined,
            groupData: groupForm.groupData.trim() || undefined,
          });

      if (!groupRes.success || !groupRes.data?.id) {
        throw new Error(
          groupRes.error?.message ||
            (isEditing
              ? "Không thể cập nhật question group"
              : "Không thể tạo question group"),
        );
      }

      const groupId = groupRes.data.id;
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
          throw new Error(delRes.error?.message || "Không thể xóa câu con đã bị bỏ");
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
          audioUrl: supportsGroupAudio(selectedGroupType)
            ? q.audioFile || undefined
            : undefined,
          imageUrl: supportsGroupImage(selectedGroupType)
            ? q.imageFile || undefined
            : undefined,
          questionData: shouldShowQuestionData(childType)
            ? q.questionData.trim() || undefined
            : undefined,
          explanation: shouldShowExplanation(childType)
            ? q.explanation.trim() || undefined
            : undefined,
          correctAnswer: isTextAnswerType(childType)
            ? q.correctAnswer.trim()
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
              `${q.id ? "Không thể cập nhật" : "Không thể tạo"} câu con ${
                qIndex + 1
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
        title: "Thành công",
        message: isEditing ? "Đã cập nhật question group" : "Đã tạo question group",
        autoClose: true,
        showCancelButton: false,
      });
    } catch (e: any) {
      error({
        title:
          dialogMode === "edit-group"
            ? "Cập nhật question group thất bại"
            : "Tạo question group thất bại",
        message: e?.message || "Đã có lỗi xảy ra",
        showCancelButton: false,
        confirmText: "Đóng",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSingleQuestion = async (questionId?: number) => {
    if (!questionId) return;

    warning({
      title: "Xóa question",
      message: "Bạn có chắc muốn xóa question này?",
      description: "Hành động này không thể hoàn tác",
      confirmText: "Xóa",
      cancelText: "Hủy",
      showCancelButton: true,
      onConfirm: async () => {
        const res = await adminApi.deleteContentQuestion({ id: questionId });
        if (res.success) {
          await onReload();
          success({
            title: "Thành công",
            message: "Đã xóa question",
            autoClose: true,
            showCancelButton: false,
          });
        } else {
          error({
            title: "Không thể xóa question",
            message: res.error?.message || "Đã có lỗi xảy ra",
            showCancelButton: false,
            confirmText: "Đóng",
          });
        }
      },
    });
  };

  const handleDeleteGroup = async (groupId?: number) => {
    if (!groupId) return;

    warning({
      title: "Xóa question group",
      message: "Bạn có chắc muốn xóa group này?",
      description: "Các câu bên trong nên được BE xử lý cascade nếu có cấu hình",
      confirmText: "Xóa",
      cancelText: "Hủy",
      showCancelButton: true,
      onConfirm: async () => {
        const res = await adminApi.deleteQuestionGroup({ id: groupId });
        if (res.success) {
          await onReload();
          success({
            title: "Thành công",
            message: "Đã xóa question group",
            autoClose: true,
            showCancelButton: false,
          });
        } else {
          error({
            title: "Không thể xóa group",
            message: res.error?.message || "Đã có lỗi xảy ra",
            showCancelButton: false,
            confirmText: "Đóng",
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
            {selectedLesson ? selectedLesson.name : "Chưa chọn lesson"}
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            {selectedLesson
              ? "Hiển thị single questions và question groups của lesson"
              : "Hãy chọn lesson để xem question"}
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
              Chưa có lesson nào được chọn
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Sau khi chọn lesson, single question và group question sẽ hiện ở đây.
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
                  {selectedLesson.durationMinutes ?? "-"} phút
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
                Các câu độc lập thuộc lesson này
              </p>
            </div>

            {normalized.singleQuestions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-700 font-semibold">
                  Chưa có single question
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
                          <p className="text-sm font-semibold text-slate-900 whitespace-pre-wrap break-words">
                            {question.content}
                          </p>

                          {question.instruction && (
                            <p className="text-xs text-slate-500 mt-2 whitespace-pre-wrap break-words">
                              Instruction: {question.instruction}
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
                                  className={`text-sm rounded-lg px-3 py-2 border ${
                                    option.isCorrect
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
                Các nhóm câu hỏi có shared content
              </p>
            </div>

            {normalized.questionGroups.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                <Layers3 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-700 font-semibold">
                  Chưa có question group
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

                          <div className="space-y-3">
                            {(group.questions || []).map((question, qIndex) => (
                              <div
                                key={`group-question-${group.id}-${question.id ?? qIndex}`}
                                className="rounded-lg border border-slate-200 p-4"
                              >
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-700 font-bold">
                                    Câu {qIndex + 1}
                                  </span>
                                  <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                                    {question.questionType}
                                  </span>
                                  <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                                    ID: {question.id}
                                  </span>
                                </div>

                                <div className="max-h-[140px] overflow-y-auto pr-1">
                                  <p className="text-sm font-semibold text-slate-900 whitespace-pre-wrap break-words">
                                    {question.content}
                                  </p>

                                  {question.instruction && (
                                    <p className="text-xs text-slate-500 mt-2 whitespace-pre-wrap break-words">
                                      Instruction: {question.instruction}
                                    </p>
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
                                          className={`text-sm rounded-lg px-3 py-2 border ${
                                            option.isCorrect
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
              {dialogMode === "edit-single" && "Sửa question"}
              {dialogMode === "edit-group" && "Sửa question group"}
              {dialogMode === "create-single" && "Thêm question"}
              {dialogMode === "create-group" && "Thêm question group"}
              {!dialogMode && "Thêm Question"}
            </DialogTitle>
          </DialogHeader>

          {step === 1 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm">
                <span className="text-slate-500">Lesson đang chọn: </span>
                <span className="font-semibold text-slate-900">
                  {selectedLesson?.name || "Chưa chọn"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setDialogMode("create-single");
                    setSelectedGroupType("");
                  }}
                  className={`rounded-xl border p-5 text-left transition ${
                    dialogMode === "create-single"
                      ? "border-[#155ca5] bg-[#155ca5]/5"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <p className="font-bold text-slate-900">Single question</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Một câu hỏi độc lập, có thể có option riêng
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDialogMode("create-group");
                    setSelectedSingleType("");
                  }}
                  className={`rounded-xl border p-5 text-left transition ${
                    dialogMode === "create-group"
                      ? "border-[#155ca5] bg-[#155ca5]/5"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <p className="font-bold text-slate-900">Question group</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Một group có passage/shared content và nhiều câu con
                  </p>
                </button>
              </div>
            </div>
          )}

          {step === 2 && dialogMode === "create-single" && (
            <div className="space-y-4">
              <p className="font-semibold text-slate-900">Chọn loại câu hỏi</p>
              <div className="grid grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-2">
                {SINGLE_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedSingleType(type)}
                    className={`rounded-lg border px-4 py-3 text-left text-sm transition ${
                      selectedSingleType === type
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
              <p className="font-semibold text-slate-900">Chọn loại group</p>
              <div className="grid grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-2">
                {GROUP_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedGroupType(type)}
                    className={`rounded-lg border px-4 py-3 text-left text-sm transition ${
                      selectedGroupType === type
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
                      placeholder="Nhập nội dung câu hỏi"
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
                      placeholder="Ví dụ: Choose the correct answer"
                    />
                  </div>

                  {supportsSingleAudio(selectedSingleType) && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Audio file</label>
                      {singleForm.existingAudioUrl && (
                        <p className="text-xs text-slate-500 break-all">
                          Current: {singleForm.existingAudioUrl}
                        </p>
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

                  {shouldShowQuestionData(selectedSingleType) && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Question Data</label>
                      <Textarea
                        rows={3}
                        value={singleForm.questionData}
                        onChange={(e) =>
                          setSingleForm((prev) => ({
                            ...prev,
                            questionData: e.target.value,
                          }))
                        }
                        placeholder="JSON/string phụ nếu type này cần dữ liệu riêng"
                      />
                    </div>
                  )}

                  {shouldShowExplanation(selectedSingleType) && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Explanation</label>
                      <Textarea
                        rows={3}
                        value={singleForm.explanation}
                        onChange={(e) =>
                          setSingleForm((prev) => ({
                            ...prev,
                            explanation: e.target.value,
                          }))
                        }
                        placeholder="Giải thích đáp án"
                      />
                    </div>
                  )}

                  {isTextAnswerType(selectedSingleType) && (
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
                        placeholder="Nhập đáp án đúng"
                      />
                    </div>
                  )}

                  {isOptionBasedType(selectedSingleType) && (
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
                                placeholder={`Nhập option ${option.optionKey}`}
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
                      placeholder="Ví dụ: Read the passage"
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
                      placeholder="Ví dụ: Read the passage and answer the questions"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Shared Content</label>
                    <Textarea
                      rows={6}
                      value={groupForm.sharedContent}
                      onChange={(e) =>
                        setGroupForm((prev) => ({
                          ...prev,
                          sharedContent: e.target.value,
                        }))
                      }
                      placeholder="Passage / transcript / prompt dùng chung cho cả group"
                    />
                  </div>

                  {supportsGroupAudio(selectedGroupType) && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Audio file</label>
                      {groupForm.existingAudioUrl && (
                        <p className="text-xs text-slate-500 break-all">
                          Current: {groupForm.existingAudioUrl}
                        </p>
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
                      placeholder="JSON/string phụ nếu cần"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">Questions in group</p>
                      <p className="text-sm text-slate-500">
                        Tạo các câu con thuộc group này
                      </p>
                    </div>

                    <Button type="button" variant="outline" onClick={addChildQuestion}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add child question
                    </Button>
                  </div>

                  <div className="max-h-[420px] overflow-y-auto pr-1 space-y-4">
                    {groupForm.questions.map((question, qIndex) => {
                      const childType = getDefaultChildType(selectedGroupType);

                      return (
                        <div
                          key={`group-form-question-${qIndex}`}
                          className="rounded-xl border border-slate-200 p-4 space-y-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-bold text-slate-900">
                                Question {qIndex + 1}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                Child type: {childType}
                              </p>
                            </div>

                            {groupForm.questions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeChildQuestion(qIndex)}
                                className="text-sm text-red-600 hover:text-red-700"
                              >
                                Xóa câu này
                              </button>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Content</label>
                            <Textarea
                              rows={3}
                              value={question.content}
                              onChange={(e) =>
                                updateGroupQuestion(qIndex, "content", e.target.value)
                              }
                              placeholder="Nội dung câu hỏi con"
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
                              placeholder="Instruction riêng cho câu này nếu có"
                            />
                          </div>

                          {supportsGroupAudio(selectedGroupType) && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Audio file</label>
                              {question.existingAudioUrl && (
                                <p className="text-xs text-slate-500 break-all">
                                  Current: {question.existingAudioUrl}
                                </p>
                              )}
                              <Input
                                type="file"
                                accept="audio/*"
                                onChange={(e) =>
                                  updateGroupQuestionFile(
                                    qIndex,
                                    "audioFile",
                                    e.target.files?.[0] || null,
                                  )
                                }
                              />
                            </div>
                          )}

                          {supportsGroupImage(selectedGroupType) && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Image file</label>
                              {question.existingImageUrl && (
                                <p className="text-xs text-slate-500 break-all">
                                  Current: {question.existingImageUrl}
                                </p>
                              )}
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  updateGroupQuestionFile(
                                    qIndex,
                                    "imageFile",
                                    e.target.files?.[0] || null,
                                  )
                                }
                              />
                            </div>
                          )}

                          {shouldShowQuestionData(childType) && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Question Data</label>
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
                                placeholder="JSON/string phụ"
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
                                placeholder="Giải thích đáp án"
                              />
                            </div>
                          )}

                          {isTextAnswerType(childType) && (
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
                                placeholder="Đáp án / expected answer / rubric"
                              />
                            </div>
                          )}

                          {isOptionBasedType(childType) && (
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
                                        placeholder={`Nhập option ${option.optionKey}`}
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
                    Quay lại
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={submitting}
                >
                  Hủy
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
                    Tiếp tục
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
                    {dialogMode === "edit-single" && "Cập nhật question"}
                    {dialogMode === "edit-group" && "Cập nhật question group"}
                    {dialogMode === "create-single" && "Tạo question"}
                    {dialogMode === "create-group" && "Tạo question group"}
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