import { ArrowLeft, ArrowRight, BookmarkCheck, CheckCircle2, XCircle } from "lucide-react";

const reviewQuestions = Array.from({ length: 24 }, (_, index) => ({
  id: index + 1,
  correct: ![2, 6, 9, 14, 19, 22].includes(index + 1),
}));

export function TestReview() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-8 md:px-6">
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#155ca5]">
                  Review
                </p>
                <h1 className="mt-2 text-2xl font-black text-[#1e2e51]">Bài đã làm</h1>
              </div>
              <div className="rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-green-700">
                18/24
              </div>
            </div>

            <div className="mt-5 grid grid-cols-6 gap-2">
              {reviewQuestions.map((question) => (
                <button
                  key={question.id}
                  type="button"
                  className={`flex h-11 items-center justify-center rounded-2xl border text-sm font-black transition ${
                    question.id === 2
                      ? "border-[#155ca5] bg-[#155ca5] text-white"
                      : question.correct
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {question.id}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Nhận xét nhanh
            </p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>Phần đọc hiểu ổn hơn phần paraphrase câu hỏi.</p>
              <p>Bạn sai nhiều ở nhóm câu cần suy luận theo đoạn hơn là tìm keyword.</p>
              <p>Nên review lại các câu đã đánh dấu và các câu chọn sai sát đáp án đúng.</p>
            </div>
          </section>
        </aside>

        <section className="space-y-4">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1e2e51] text-lg font-black text-white">
                  2
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#155ca5]">
                    Câu sai cần xem lại
                  </p>
                  <h2 className="mt-1 text-xl font-black text-[#1e2e51]">
                    Which option best completes the sentence?
                  </h2>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700">
                <BookmarkCheck className="h-4 w-4" />
                Đã đánh dấu
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-lg leading-8 text-[#1e2e51]">
              Succession planning presents another critical aspect of family business dynamics.
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-5">
                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-red-700">
                  <XCircle className="h-4 w-4" />
                  Bạn chọn
                </div>
                <p className="mt-3 text-base font-semibold text-red-800">
                  A. Succession planning is only somewhat important for family businesses.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-green-200 bg-green-50 p-5">
                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Đáp án đúng
                </div>
                <p className="mt-3 text-base font-semibold text-green-800">
                  D. A crucial aspect of family business dynamics is planning for leadership succession.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-[#dbeafe] bg-[#f8fbff] p-5">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#155ca5]">
                Giải thích
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                Câu gốc nhấn mạnh succession planning là một khía cạnh rất quan trọng. Vì vậy đáp án đúng
                phải giữ được ý “critical aspect”, không được làm nhẹ đi mức độ quan trọng.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Câu trước
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-[#155ca5] px-5 py-3 text-sm font-black text-white"
            >
              Câu sai tiếp theo
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
