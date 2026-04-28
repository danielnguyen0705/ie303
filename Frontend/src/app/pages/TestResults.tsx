import { ArrowRight, CheckCircle2, Eye, RotateCcw, Timer } from "lucide-react";

const skillRows = [
  { label: "Listening", score: "8/10" },
  { label: "Reading", score: "22/30" },
  { label: "Grammar", score: "9/10" },
  { label: "Vocabulary", score: "10/10" },
];

export function TestResults() {
  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-8 md:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-[2.25rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
            <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-full border-[14px] border-[#155ca5] bg-[#f8fbff]">
              <div className="text-center">
                <div className="text-5xl font-black text-[#1e2e51]">85</div>
                <div className="mt-1 text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
                  Tổng điểm
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                Hoàn thành bài test
              </div>
              <h1 className="text-3xl font-black tracking-tight text-[#1e2e51]">Kết quả bài thi</h1>
              <p className="text-slate-600">
                Bạn làm tốt ở nhóm câu từ vựng và ngữ pháp. Reading vẫn còn mất điểm ở những câu cần
                paraphrase và suy luận theo đoạn.
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Thời gian</div>
                  <div className="mt-2 flex items-center gap-2 text-lg font-black text-[#1e2e51]">
                    <Timer className="h-4 w-4 text-[#155ca5]" />
                    52:18
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Độ chính xác</div>
                  <div className="mt-2 text-lg font-black text-[#1e2e51]">85%</div>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Câu đúng</div>
                  <div className="mt-2 text-lg font-black text-[#1e2e51]">34/40</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-[#1e2e51]">Phân tích theo kỹ năng</h2>
          <div className="mt-5 grid gap-3">
            {skillRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <span className="font-semibold text-[#1e2e51]">{row.label}</span>
                <span className="text-sm font-black text-[#155ca5]">{row.score}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700"
          >
            <Eye className="h-4 w-4" />
            Xem review
          </button>
          <button
            type="button"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700"
          >
            <RotateCcw className="h-4 w-4" />
            Làm lại
          </button>
          <button
            type="button"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#155ca5] px-5 py-3 text-sm font-black text-white"
          >
            Tiếp tục
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </main>
  );
}
