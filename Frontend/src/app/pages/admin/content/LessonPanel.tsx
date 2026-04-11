import { FileText, HelpCircle, Loader2, Trash2, ChevronRight } from "lucide-react";
import type { Lesson, Question, Section } from "@/api/admin/types";

type ActiveStage = "grade" | "unit" | "section" | "lesson" | "question";

type LessonPanelProps = {
  selectedSection: Section | null;
  lessons: Lesson[];
  selectedLesson: Lesson | null;
  questions: Question[];
  activeStage: ActiveStage;
  deletingItem: string | null;
  panelLoading?: boolean;
  onSelectLesson: (lesson: Lesson) => void;
  onDeleteLesson: (id: number) => void;
  onExpandLesson: () => void;
};

function CompactStageCard({
  label,
  title,
  description,
  onExpand,
}: {
  label: string;
  title: string;
  description?: string;
  onExpand: () => void;
}) {
  return (
    <button
      onClick={onExpand}
      className="w-full text-left bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:border-[#155ca5]/40 hover:bg-slate-50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-[#155ca5] font-bold">
            {label}
          </p>
          <p className="text-sm font-semibold text-slate-900 truncate">{title}</p>
          <p className="text-xs text-slate-500 line-clamp-2">
            {description || "Nhấn để mở lại danh sách"}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
      </div>
    </button>
  );
}

function StageHeader({
  title,
  count,
}: {
  title: string;
  count: number;
}) {
  return (
    <div className="p-4 border-b border-slate-200 flex items-center gap-2">
      <div className="text-[#155ca5]">
        <FileText className="w-4 h-4" />
      </div>
      <h2 className="font-bold text-base text-slate-900">
        {title} ({count})
      </h2>
    </div>
  );
}

export default function LessonPanel({
  selectedSection,
  lessons,
  selectedLesson,
  questions,
  activeStage,
  deletingItem,
  panelLoading,
  onSelectLesson,
  onDeleteLesson,
  onExpandLesson,
}: LessonPanelProps) {
  const isLessonExpanded = activeStage === "lesson" || !selectedSection;

  return (
    <div className="grid grid-cols-12 gap-5">
      <div className="col-span-4">
        {selectedSection &&
          (isLessonExpanded ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <StageHeader title="Lessons" count={lessons.length} />

              <div className="px-4 pt-2 text-xs text-slate-500">
                Section: <span className="font-semibold">{selectedSection.name}</span>
              </div>

              <div className="max-h-[620px] overflow-y-auto divide-y divide-slate-200 mt-2">
                {lessons.length === 0 ? (
                  <div className="p-5 text-sm text-slate-500 text-center">
                    No lessons found
                  </div>
                ) : (
                  lessons.map((lesson, index) => (
                    <div
                      key={`lesson-${lesson.id}`}
                      onClick={() => onSelectLesson(lesson)}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedLesson?.id === lesson.id
                          ? "bg-[#155ca5]/10 border-l-4 border-[#155ca5]"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-[#155ca5] mb-1">
                            LESSON {lesson.lessonNumber ?? lesson.orderIndex ?? index + 1}
                          </p>
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {lesson.name}
                          </p>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                            {lesson.description || "No description"}
                          </p>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteLesson(lesson.id);
                          }}
                          disabled={deletingItem === `lesson-${lesson.id}`}
                          className="p-1.5 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                        >
                          {deletingItem === `lesson-${lesson.id}` ? (
                            <Loader2 className="w-3.5 h-3.5 text-red-600 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : selectedLesson ? (
            <CompactStageCard
              label="Lesson"
              title={selectedLesson.name}
              description={selectedLesson.description}
              onExpand={onExpandLesson}
            />
          ) : null)}
      </div>

      <div className="col-span-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[620px] overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[#155ca5] mb-1">
                <HelpCircle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wide">
                  Detail panel
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                {selectedLesson ? selectedLesson.name : "Chưa chọn lesson"}
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                {selectedLesson
                  ? selectedLesson.description || "Không có mô tả"
                  : "Hãy chọn section → lesson để xem chi tiết và câu hỏi"}
              </p>
            </div>

            {selectedLesson && (
              <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-right">
                <p className="text-xs text-slate-500">Questions</p>
                <p className="text-lg font-bold text-slate-900">{questions.length}</p>
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
                  Sau khi chọn lesson, các question của bài sẽ hiện ở đây.
                </p>
              </div>
            </div>
          ) : panelLoading ? (
            <div className="flex items-center justify-center min-h-[500px]">
              <Loader2 className="w-8 h-8 animate-spin text-[#155ca5]" />
            </div>
          ) : (
            <div className="p-5 space-y-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold text-[#155ca5] uppercase tracking-wide">
                  Lesson Info
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
                </div>
              </div>

              <div>
                <p className="text-lg font-bold text-slate-900">
                  Questions ({questions.length})
                </p>
                <p className="text-sm text-slate-500 mb-3">
                  Danh sách câu hỏi của lesson đang chọn
                </p>

                {questions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                    <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-700 font-semibold">Chưa có câu hỏi</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Lesson này hiện chưa có question hoặc API chưa trả dữ liệu.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {questions.map((question, index) => (
                      <div
                        key={`question-${question.id ?? index}`}
                        className="rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[11px] px-2 py-1 rounded-full bg-[#155ca5]/10 text-[#155ca5] font-bold">
                                QUESTION {index + 1}
                              </span>
                              {question.type && (
                                <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold">
                                  {question.type}
                                </span>
                              )}
                            </div>

                            <p className="text-sm font-semibold text-slate-900">
                              {question.content}
                            </p>

                            {question.explanation && (
                              <p className="text-xs text-slate-500 mt-2">
                                Explanation: {question.explanation}
                              </p>
                            )}

                            {question.options && question.options.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {question.options.map((option, optionIndex) => (
                                  <div
                                    key={`option-${question.id ?? index}-${option.id ?? optionIndex}`}
                                    className={`text-sm rounded-lg px-3 py-2 border ${
                                      option.isCorrect
                                        ? "bg-green-50 border-green-200 text-green-800"
                                        : "bg-slate-50 border-slate-200 text-slate-700"
                                    }`}
                                  >
                                    {option.content}
                                  </div>
                                ))}
                              </div>
                            )}

                            {question.correctAnswer && (
                              <p className="text-xs font-medium text-slate-700 mt-3">
                                Correct answer: {question.correctAnswer}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}