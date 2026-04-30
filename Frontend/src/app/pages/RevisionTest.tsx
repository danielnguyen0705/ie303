import { Bookmark, Clock3, X } from "lucide-react";

const sampleQuestions = [
  {
    id: 1,
    text: "The writer suggests that family businesses contribute strongly to both economies and communities.",
    selected: "A",
  },
  {
    id: 2,
    text: "What is the main idea of paragraph 3?",
    selected: "",
  },
  {
    id: 3,
    text: "Which of the following best paraphrases the underlined sentence?",
    selected: "",
  },
];

export function RevisionTest() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-6 md:px-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center gap-4">
            <button type="button" className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200">
              <X className="h-5 w-5 text-slate-500" />
            </button>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#155ca5]">Revision Test</p>
              <h1 className="mt-1 text-xl font-black text-[#1e2e51]">Đề đọc hiểu tổng hợp</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-[#1e2e51]">
              <Clock3 className="h-4 w-4 text-[#155ca5]" />
              01:39s
            </div>
          </div>
        </header>

        <section className="grid gap-5 xl:grid-cols-[minmax(520px,1.15fr)_minmax(420px,0.85fr)]">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="rounded-[1.5rem] border border-[#dbeafe] bg-[#f8fbff] p-5">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#155ca5]">Yêu cầu chung</p>
              <p className="mt-2 text-base leading-8 text-[#1e2e51]">
                Questions 18 - 25. Read the following passage about the dynamics of family businesses and
                mark the letter A, B, C, or D on your answer sheet.
              </p>
            </div>

            <div className="mt-6 space-y-6 text-[17px] leading-8 text-slate-700">
              <p>
                Family businesses are the backbone of many economies around the world. In fact, they
                represent an estimated 70% of global GDP and employ a significant portion of the workforce.
              </p>
              <p>
                One of the most defining features of family businesses is the overlap between family and
                business spheres. This intertwining can be both a source of strength and a potential
                challenge.
              </p>
              <p>
                Succession planning presents another critical aspect of family business dynamics. The
                question of who will inherit the leadership role and how the transition will be managed is
                often fraught with emotional and practical complexities.
              </p>
              <p>
                Finally, maintaining a balance between tradition and innovation is a perpetual challenge for
                family businesses.
              </p>
            </div>
          </article>

          <section className="space-y-4">
            {sampleQuestions.map((question) => (
              <div key={question.id} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1e2e51] text-lg font-black text-white">
                      {question.id}
                    </div>
                    <div className="text-lg font-black text-[#1e2e51]">Câu {question.id}</div>
                  </div>

                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-500"
                  >
                    <Bookmark className="h-4 w-4" />
                    Đánh dấu để xem lại
                  </button>
                </div>

                <p className="mt-5 text-base leading-8 text-[#1e2e51]">{question.text}</p>

                <div className="mt-5 space-y-3">
                  {["A", "B", "C", "D"].map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`grid w-full grid-cols-[44px_minmax(0,1fr)] items-center gap-3 rounded-[1.5rem] border px-4 py-4 text-left transition ${
                        question.selected === option
                          ? "border-[#155ca5] bg-[#f8fbff]"
                          : "border-slate-200 bg-white hover:border-[#155ca5]/35"
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl font-black ${
                          question.selected === option
                            ? "bg-[#155ca5] text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {option}
                      </span>
                      <span className="font-semibold text-[#1e2e51]">Sample answer option {option}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </section>
      </div>
    </main>
  );
}
