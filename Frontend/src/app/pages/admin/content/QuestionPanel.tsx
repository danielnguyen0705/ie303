import { useMemo, useState } from "react";
import {
  Plus,
  Loader2,
  HelpCircle,
  Layers3,
  FileText,
  Trash2,
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

type AddMode = "single" | "group";
type WizardStep = 1 | 2 | 3;

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

const OPTION_KEYS = ["A", "B", "C", "D"];

function createDefaultOptions(): QuestionOptionItem[] {
  return OPTION_KEYS.map((key) => ({
    optionKey: key,
    content: "",
    isCorrect: false,
  }));
}

function isOptionBasedType(type?: string) {
  return !!type && OPTION_BASED_TYPES.includes(type);
}

function isTextAnswerType(type?: string) {
  return !!type && TEXT_ANSWER_TYPES.includes(type);
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

export default function QuestionPanel({
  selectedLesson,
  questionsPayload,
  onReload,
}: Props) {
  const { success, error, warning, notification, close } =
    useNotificationPopup();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [step, setStep] = useState<WizardStep>(1);
  const [mode, setMode] = useState<AddMode | null>(null);

  const [selectedSingleType, setSelectedSingleType] = useState("");
  const [selectedGroupType, setSelectedGroupType] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [singleForm, setSingleForm] = useState({
    content: "",
    instruction: "",
    audioUrl: "",
    imageUrl: "",
    questionData: "",
    explanation: "",
    correctAnswer: "",
    options: createDefaultOptions(),
  });

  const [groupForm, setGroupForm] = useState({
    title: "",
    instruction: "",
    sharedContent: "",
    audioUrl: "",
    imageUrl: "",
    groupData: "",
    questions: [
      {
        content: "",
        instruction: "",
        audioUrl: "",
        imageUrl: "",
        questionData: "",
        explanation: "",
        correctAnswer: "",
        options: createDefaultOptions(),
      },
    ],
  });

  const normalized = useMemo(
    () => normalizePayload(questionsPayload),
    [questionsPayload],
  );

  const resetAll = () => {
    setStep(1);
    setMode(null);
    setSelectedSingleType("");
    setSelectedGroupType("");
    setSubmitting(false);

    setSingleForm({
      content: "",
      instruction: "",
      audioUrl: "",
      imageUrl: "",
      questionData: "",
      explanation: "",
      correctAnswer: "",
      options: createDefaultOptions(),
    });

    setGroupForm({
      title: "",
      instruction: "",
      sharedContent: "",
      audioUrl: "",
      imageUrl: "",
      groupData: "",
      questions: [
        {
          content: "",
          instruction: "",
          audioUrl: "",
          imageUrl: "",
          questionData: "",
          explanation: "",
          correctAnswer: "",
          options: createDefaultOptions(),
        },
      ],
    });
  };

  const openAddDialog = () => {
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
    setIsAddOpen(true);
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
      | "audioUrl"
      | "imageUrl"
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
    setGroupForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          content: "",
          instruction: "",
          audioUrl: "",
          imageUrl: "",
          questionData: "",
          explanation: "",
          correctAnswer: "",
          options: createDefaultOptions(),
        },
      ],
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

      const createdQuestion = await adminApi.createContentQuestion({
        lessonId: selectedLesson!.id,
        questionType: selectedSingleType as never,
        content: singleForm.content.trim(),
        instruction: singleForm.instruction.trim() || undefined,
        audioUrl: singleForm.audioUrl.trim() || undefined,
        imageUrl: singleForm.imageUrl.trim() || undefined,
        questionData: singleForm.questionData.trim() || undefined,
        explanation: singleForm.explanation.trim() || undefined,
        correctAnswer: isTextAnswerType(selectedSingleType)
          ? singleForm.correctAnswer.trim()
          : undefined,
        questionGroupId: null,
      });

      if (!createdQuestion.success || !createdQuestion.data?.id) {
        throw new Error(
          createdQuestion.error?.message || "Không thể tạo question",
        );
      }

      if (isOptionBasedType(selectedSingleType)) {
        for (let i = 0; i < singleForm.options.length; i += 1) {
          const option = singleForm.options[i];
          const optionRes = await adminApi.createQuestionOption({
            optionKey: option.optionKey || OPTION_KEYS[i],
            content: option.content.trim(),
            isCorrect: option.isCorrect,
            questionId: createdQuestion.data.id,
          });

          if (!optionRes.success) {
            throw new Error(
              optionRes.error?.message || `Không thể tạo option ${i + 1}`,
            );
          }
        }
      }

      setIsAddOpen(false);
      resetAll();
      await onReload();

      success({
        title: "Thành công",
        message: "Đã tạo question",
        autoClose: true,
        showCancelButton: false,
      });
    } catch (e: any) {
      error({
        title: "Tạo question thất bại",
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

      const createdGroup = await adminApi.createQuestionGroup({
        lessonId: selectedLesson!.id,
        groupType: selectedGroupType as never,
        title: groupForm.title.trim(),
        instruction: groupForm.instruction.trim() || undefined,
        sharedContent: groupForm.sharedContent.trim() || undefined,
        audioUrl: groupForm.audioUrl.trim() || undefined,
        imageUrl: groupForm.imageUrl.trim() || undefined,
        groupData: groupForm.groupData.trim() || undefined,
      });

      if (!createdGroup.success || !createdGroup.data?.id) {
        throw new Error(
          createdGroup.error?.message || "Không thể tạo question group",
        );
      }

      const childType = getDefaultChildType(selectedGroupType);

      for (let qIndex = 0; qIndex < groupForm.questions.length; qIndex += 1) {
        const q = groupForm.questions[qIndex];

        const createdQuestion = await adminApi.createContentQuestion({
          lessonId: selectedLesson!.id,
          questionType: childType as never,
          content: q.content.trim(),
          instruction:
            q.instruction.trim() || groupForm.instruction.trim() || undefined,
          audioUrl: q.audioUrl.trim() || undefined,
          imageUrl: q.imageUrl.trim() || undefined,
          questionData: q.questionData.trim() || undefined,
          explanation: q.explanation.trim() || undefined,
          correctAnswer: isTextAnswerType(childType)
            ? q.correctAnswer.trim()
            : undefined,
          questionGroupId: createdGroup.data.id,
        });

        if (!createdQuestion.success || !createdQuestion.data?.id) {
          throw new Error(
            createdQuestion.error?.message ||
              `Không thể tạo câu con ${qIndex + 1}`,
          );
        }

        if (isOptionBasedType(childType)) {
          for (let oIndex = 0; oIndex < q.options.length; oIndex += 1) {
            const opt = q.options[oIndex];
            const optionRes = await adminApi.createQuestionOption({
              optionKey: opt.optionKey || OPTION_KEYS[oIndex],
              content: opt.content.trim(),
              isCorrect: opt.isCorrect,
              questionId: createdQuestion.data.id,
            });

            if (!optionRes.success) {
              throw new Error(
                optionRes.error?.message ||
                  `Không thể tạo option ${oIndex + 1} của câu ${qIndex + 1}`,
              );
            }
          }
        }
      }

      setIsAddOpen(false);
      resetAll();
      await onReload();

      success({
        title: "Thành công",
        message: "Đã tạo question group",
        autoClose: true,
        showCancelButton: false,
      });
    } catch (e: any) {
      error({
        title: "Tạo question group thất bại",
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
            <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-right">
              <p className="text-xs text-slate-500">Total</p>
              <p className="text-lg font-bold text-slate-900">
                {normalized.totalQuestions}
              </p>
            </div>

            <Button onClick={openAddDialog}>
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
              Sau khi chọn lesson, single question và group question sẽ hiện ở
              đây.
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
                  {selectedLesson.lessonNumber ??
                    selectedLesson.orderIndex ??
                    "-"}
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
              <div className="space-y-3">
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

                        <p className="text-sm font-semibold text-slate-900">
                          {question.content}
                        </p>

                        {question.instruction && (
                          <p className="text-xs text-slate-500 mt-2">
                            Instruction: {question.instruction}
                          </p>
                        )}

                        {question.correctAnswer && (
                          <p className="text-xs text-emerald-600 mt-2 font-medium">
                            Correct answer: {question.correctAnswer}
                          </p>
                        )}

                        {question.explanation && (
                          <p className="text-xs text-slate-500 mt-2">
                            Explanation: {question.explanation}
                          </p>
                        )}

                        {Array.isArray(question.options) &&
                          question.options.length > 0 && (
                            <div className="mt-3 space-y-2">
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
                                  {option.content}
                                </div>
                              ))}
                            </div>
                          )}
                      </div>

                      <button
                        onClick={() => void handleDeleteSingleQuestion(question.id)}
                        className="p-2 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
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
              <div className="space-y-4">
                {normalized.questionGroups.map((group, groupIndex) => (
                  <div
                    key={`group-${group.id ?? groupIndex}`}
                    className="rounded-xl border border-slate-200 overflow-hidden"
                  >
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
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

                        <p className="text-base font-bold text-slate-900">
                          {group.title || "Untitled group"}
                        </p>

                        {group.instruction && (
                          <p className="text-sm text-slate-500 mt-1">
                            {group.instruction}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => void handleDeleteGroup(group.id)}
                        className="p-2 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>

                    <div className="p-4 space-y-4">
                      {group.sharedContent && (
                        <div className="rounded-lg border border-slate-200 p-3 bg-white">
                          <p className="text-xs font-bold text-slate-500 mb-2 uppercase">
                            Shared content
                          </p>
                          <p className="text-sm text-slate-800 whitespace-pre-wrap">
                            {group.sharedContent}
                          </p>
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

                            <p className="text-sm font-semibold text-slate-900">
                              {question.content}
                            </p>

                            {question.instruction && (
                              <p className="text-xs text-slate-500 mt-2">
                                Instruction: {question.instruction}
                              </p>
                            )}

                            {question.correctAnswer && (
                              <p className="text-xs text-emerald-600 mt-2 font-medium">
                                Correct answer: {question.correctAnswer}
                              </p>
                            )}

                            {Array.isArray(question.options) &&
                              question.options.length > 0 && (
                                <div className="mt-3 space-y-2">
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
                                      {option.content}
                                    </div>
                                  ))}
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) resetAll();
        }}
      >
        <DialogContent
          className="max-w-5xl max-h-[90vh] overflow-y-auto"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle>Thêm Question</DialogTitle>
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
                  onClick={() => setMode("single")}
                  className={`rounded-xl border p-5 text-left transition ${
                    mode === "single"
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
                  onClick={() => setMode("group")}
                  className={`rounded-xl border p-5 text-left transition ${
                    mode === "group"
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

          {step === 2 && mode === "single" && (
            <div className="space-y-4">
              <p className="font-semibold text-slate-900">Chọn loại câu hỏi</p>
              <div className="grid grid-cols-2 gap-3">
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

          {step === 2 && mode === "group" && (
            <div className="space-y-4">
              <p className="font-semibold text-slate-900">Chọn loại group</p>
              <div className="grid grid-cols-2 gap-3">
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

          {step === 3 && mode === "single" && (
            <div className="space-y-5">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm">
                  <span className="text-slate-500">Question type: </span>
                  <span className="font-semibold text-slate-900">
                    {selectedSingleType}
                  </span>
                </p>
              </div>

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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Audio URL</label>
                  <Input
                    value={singleForm.audioUrl}
                    onChange={(e) =>
                      setSingleForm((prev) => ({
                        ...prev,
                        audioUrl: e.target.value,
                      }))
                    }
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Image URL</label>
                  <Input
                    value={singleForm.imageUrl}
                    onChange={(e) =>
                      setSingleForm((prev) => ({
                        ...prev,
                        imageUrl: e.target.value,
                      }))
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>

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
              )}
            </div>
          )}

          {step === 3 && mode === "group" && (
            <div className="space-y-5">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm">
                  <span className="text-slate-500">Group type: </span>
                  <span className="font-semibold text-slate-900">
                    {selectedGroupType}
                  </span>
                </p>
              </div>

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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Audio URL</label>
                  <Input
                    value={groupForm.audioUrl}
                    onChange={(e) =>
                      setGroupForm((prev) => ({
                        ...prev,
                        audioUrl: e.target.value,
                      }))
                    }
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Image URL</label>
                  <Input
                    value={groupForm.imageUrl}
                    onChange={(e) =>
                      setGroupForm((prev) => ({
                        ...prev,
                        imageUrl: e.target.value,
                      }))
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>

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

              <div className="space-y-4">
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

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Audio URL</label>
                          <Input
                            value={question.audioUrl}
                            onChange={(e) =>
                              updateGroupQuestion(qIndex, "audioUrl", e.target.value)
                            }
                            placeholder="https://..."
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Image URL</label>
                          <Input
                            value={question.imageUrl}
                            onChange={(e) =>
                              updateGroupQuestion(qIndex, "imageUrl", e.target.value)
                            }
                            placeholder="https://..."
                          />
                        </div>
                      </div>

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

                      {isTextAnswerType(childType) && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Correct Answer</label>
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
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter>
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                {step > 1 && (
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
                  onClick={() => setIsAddOpen(false)}
                  disabled={submitting}
                >
                  Hủy
                </Button>

                {step < 3 ? (
                  <Button
                    onClick={() => {
                      if (step === 1 && !mode) return;
                      if (step === 2 && mode === "single" && !selectedSingleType) {
                        return;
                      }
                      if (step === 2 && mode === "group" && !selectedGroupType) {
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
                      void (mode === "single"
                        ? handleSubmitSingle()
                        : handleSubmitGroup())
                    }
                    disabled={submitting}
                  >
                    {submitting && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {mode === "single" ? "Tạo question" : "Tạo question group"}
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