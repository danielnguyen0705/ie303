import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ChevronLeft, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { getQuestionsByLesson } from "@/api";
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

type AnswerState = Record<
  number,
  {
    answer: string | string[];
    submitted: boolean;
    correct: boolean | null;
  }
>;

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

function isPlaceholderType(type: QuestionType) {
  return [
    "SENTENCE_REORDER",
    "SENTENCE_REWRITE",
    "ESSAY_WRITING",
    "MATCHING",
    "PRONUNCIATION",
    "TOPIC_SPEAKING",
  ].includes(type);
}

function renderSharedContent(group: QuestionGroupDto | null) {
  if (!group) return null;

  if (!group.sharedContent && !group.title && !group.instruction) return null;

  return (
    <div className="bg-[#f8fbff] border border-[#dbeafe] rounded-2xl p-6 space-y-3">
      {group.title && (
        <h3 className="text-xl font-black text-[#1e2e51]">{group.title}</h3>
      )}
      {group.instruction && (
        <p className="text-sm font-medium text-[#155ca5]">{group.instruction}</p>
      )}
      {group.sharedContent && (
        <div className="text-gray-700 leading-7 whitespace-pre-wrap">
          {group.sharedContent}
        </div>
      )}
    </div>
  );
}

export function LessonRunner() {
  const { lessonId } = useParams();
  const lessonIdNumber = useMemo(() => Number(lessonId), [lessonId]);

  const [data, setData] = useState<LessonQuestionResponse | null>(null);
  const [questions, setQuestions] = useState<FlatQuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [finished, setFinished] = useState(false);

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

  const currentItem = questions[currentIndex];
  const currentQuestion = currentItem?.question;
  const currentGroup = currentItem?.group;
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  const totalCorrect = useMemo(() => {
    return Object.values(answers).filter((a) => a.correct === true).length;
  }, [answers]);

  const progressPercent =
    questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  const setAnswer = (questionId: number, answer: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        answer,
        submitted: false,
        correct: null,
      },
    }));
  };

  const submitCurrent = () => {
    if (!currentQuestion) return;

    const saved = answers[currentQuestion.id];
    if (!saved) return;

    let correct = false;

    if (isMCQ(currentQuestion.questionType)) {
      const selected = String(saved.answer);
      const correctOption = currentQuestion.options.find((o) => o.isCorrect);
      correct = correctOption ? correctOption.optionKey === selected : false;
    } else if (currentQuestion.questionType === "TRUE_FALSE_NG") {
      const selected = String(saved.answer).trim().toLowerCase();
      const expected = String(currentQuestion.correctAnswer ?? "")
        .trim()
        .toLowerCase();
      correct = selected === expected;
    } else if (isFillType(currentQuestion.questionType)) {
      const typed = String(saved.answer).trim().toLowerCase();
      const expected = String(currentQuestion.correctAnswer ?? "")
        .trim()
        .toLowerCase();
      correct = typed === expected;
    } else {
      correct = false;
    }

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        submitted: true,
        correct,
      },
    }));
  };

  const goNext = () => {
    if (currentIndex >= questions.length - 1) {
      setFinished(true);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
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
            <h1 className="text-4xl font-black text-[#1e2e51]">Hoàn thành lesson</h1>
            <p className="text-gray-600 mt-3 text-lg">
              Bạn làm đúng {totalCorrect}/{questions.length} câu.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => {
                setFinished(false);
                setCurrentIndex(0);
                setAnswers({});
              }}
              className="px-6 py-3 rounded-xl bg-[#155ca5] text-white font-bold hover:bg-[#0f4c88]"
            >
              Làm lại
            </button>

            <Link
              to="/"
              className="px-6 py-3 rounded-xl border border-gray-300 font-bold text-[#1e2e51] hover:bg-gray-50"
            >
              Về dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

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
          <div className="flex items-center justify-between">
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
        {renderSharedContent(currentGroup)}

        <div className="bg-white rounded-3xl shadow-sm p-8 space-y-6">
          <div className="space-y-3">
            <div className="inline-block px-3 py-1 rounded-full bg-[#f3f7ff] text-[#155ca5] text-xs font-bold uppercase tracking-wider">
              {getQuestionTypeLabel(currentQuestion.questionType)}
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

          {isMCQ(currentQuestion.questionType) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option) => {
                const selected = currentAnswer?.answer === option.optionKey;
                const submitted = currentAnswer?.submitted;
                const isCorrectOption = option.isCorrect;

                let extraClass =
                  "border-gray-200 bg-white hover:border-[#155ca5]/40";

                if (submitted) {
                  if (isCorrectOption) {
                    extraClass = "border-green-400 bg-green-50";
                  } else if (selected) {
                    extraClass = "border-red-400 bg-red-50";
                  } else {
                    extraClass = "border-gray-200 bg-white";
                  }
                } else if (selected) {
                  extraClass = "border-[#155ca5] bg-[#f3f7ff]";
                }

                return (
                  <button
                    key={option.id}
                    disabled={submitted}
                    onClick={() => setAnswer(currentQuestion.id, option.optionKey)}
                    className={`text-left rounded-2xl border-2 p-5 transition-all ${extraClass}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white border flex items-center justify-center font-black">
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
          )}

          {currentQuestion.questionType === "TRUE_FALSE_NG" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {["true", "false", "not given"].map((value) => {
                const selected = currentAnswer?.answer === value;
                const submitted = currentAnswer?.submitted;

                return (
                  <button
                    key={value}
                    disabled={submitted}
                    onClick={() => setAnswer(currentQuestion.id, value)}
                    className={`rounded-2xl border-2 p-5 font-bold uppercase transition-all ${
                      selected
                        ? "border-[#155ca5] bg-[#f3f7ff]"
                        : "border-gray-200 bg-white hover:border-[#155ca5]/40"
                    }`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          )}

          {isFillType(currentQuestion.questionType) && (
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
          )}

          {isPlaceholderType(currentQuestion.questionType) && (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6">
              <p className="font-bold text-[#1e2e51]">
                Dạng {getQuestionTypeLabel(currentQuestion.questionType)} sẽ làm UI riêng sau.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Hiện tại mình đang để placeholder để flow lesson chạy trước.
              </p>
            </div>
          )}

          {currentAnswer?.submitted && (
            <div
              className={`rounded-2xl p-5 border ${
                currentAnswer.correct
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {currentAnswer.correct ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 mt-0.5" />
                )}

                <div>
                  <p
                    className={`font-black ${
                      currentAnswer.correct ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {currentAnswer.correct ? "Chính xác!" : "Chưa đúng"}
                  </p>

                  {currentQuestion.explanation && (
                    <p className="text-gray-700 mt-1">{currentQuestion.explanation}</p>
                  )}

                  {!currentAnswer.correct &&
                    isFillType(currentQuestion.questionType) &&
                    currentQuestion.correctAnswer && (
                      <p className="text-sm font-semibold text-gray-600 mt-2">
                        Đáp án đúng: {currentQuestion.correctAnswer}
                      </p>
                    )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="mt-8 flex items-center justify-between gap-4">
        <div className="text-sm text-gray-500 font-medium">
          Đúng {totalCorrect}/{questions.length} câu
        </div>

        <div className="flex items-center gap-3">
          {!currentAnswer?.submitted ? (
            <button
              onClick={submitCurrent}
              disabled={!currentAnswer?.answer}
              className="px-6 py-3 rounded-xl bg-[#155ca5] text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0f4c88]"
            >
              Kiểm tra
            </button>
          ) : (
            <button
              onClick={goNext}
              className="px-6 py-3 rounded-xl bg-[#27ae60] text-white font-bold hover:bg-[#1f8b4d]"
            >
              {currentIndex === questions.length - 1 ? "Kết thúc" : "Câu tiếp"}
            </button>
          )}
        </div>
      </footer>
    </main>
  );
}