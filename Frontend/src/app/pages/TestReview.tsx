import { ArrowLeft, Save, ArrowRight, Lightbulb } from 'lucide-react';

export function TestReview() {
  const questions = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    correct: ![2, 6, 12, 18, 24, 33, 41, 47].includes(i + 1),
  }));

  return (
    <div className="min-h-screen bg-[#f6f6ff] pb-20">
      <main className="pt-8 pb-12 px-6 max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Left Column: Navigation Grid */}
        <aside className="w-full md:w-80 shrink-0 space-y-6">
          <div className="bg-[#eef0ff] p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-['Nunito'] font-bold text-xl text-[#155ca5]">Quest Review</h2>
              <span className="bg-[#75f39c] text-[#00592b] px-3 py-1 rounded-full text-xs font-bold">84% Score</span>
            </div>
            
            <div className="flex items-center justify-between mb-4 px-1">
              <label className="inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="relative w-11 h-6 bg-[#d1dcff] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#155ca5]"></div>
                <span className="ms-3 text-sm font-medium text-[#1e2e51]">Chỉ xem câu sai</span>
              </label>
            </div>

            {/* Question Grid */}
            <div className="grid grid-cols-5 gap-3">
              {questions.map((q) => (
                <button
                  key={q.id}
                  className={`w-full aspect-square flex items-center justify-center rounded-lg font-bold transition-all ${
                    q.id === 2
                      ? 'bg-[#b31b25] text-white ring-4 ring-[#b31b25]/20 scale-110'
                      : q.correct
                      ? 'bg-[#006a35] text-white hover:scale-105'
                      : 'bg-[#b31b25] text-white hover:scale-105'
                  }`}
                >
                  {q.id}
                </button>
              ))}
            </div>
          </div>

          {/* Performance Insights */}
          <div className="bg-[#eef0ff] p-6 rounded-lg">
            <h3 className="font-bold text-[#1e2e51] mb-4">Performance Insights</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm opacity-70">Grammar Focus</span>
                  <span className="text-sm font-bold text-[#006a35]">92%</span>
                </div>
                <div className="w-full h-2 bg-[#d1dcff] rounded-full overflow-hidden">
                  <div className="h-full bg-[#006a35] w-[92%]"></div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-70">Vocabulary Level</span>
                <span className="text-sm font-bold text-[#6f5900]">B2+</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Column: Question Details */}
        <section className="flex-1 space-y-6">
          {/* Main Question Card */}
          <div className="bg-white p-8 rounded-lg shadow-[0_32px_32px_-12px_rgba(30,46,81,0.06)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <span className="bg-[#fb5151] text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                ✕ Incorrect
              </span>
            </div>

            <div className="mb-8">
              <span className="font-mono font-medium text-[#155ca5] bg-[#73aaf9]/20 px-3 py-1 rounded-md text-sm mb-4 inline-block">
                QUESTION 2 • ADVANCED TENSES
              </span>
              <h1 className="font-['Nunito'] text-2xl font-bold text-[#1e2e51] leading-snug">
                By the time the professor arrived, the students{' '}
                <span className="text-[#155ca5] underline decoration-2 underline-offset-4 font-black">__________</span>{' '}
                the experimental setup for twenty minutes.
              </h1>
            </div>

            {/* Answer Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              <div className="bg-[#fb5151]/5 p-6 rounded-lg border-2 border-[#fb5151]/10 relative">
                <span className="absolute -top-3 left-4 bg-[#b31b25] text-white text-xs font-bold px-2 py-0.5 rounded">
                  YOUR ANSWER
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-[#b31b25]">✕</span>
                  <span className="font-mono font-medium text-lg text-[#b31b25]">had been preparing</span>
                </div>
              </div>
              <div className="bg-[#75f39c]/5 p-6 rounded-lg border-2 border-[#75f39c]/10 relative">
                <span className="absolute -top-3 left-4 bg-[#006a35] text-white text-xs font-bold px-2 py-0.5 rounded">
                  CORRECT ANSWER
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-[#006a35]">✓</span>
                  <span className="font-mono font-medium text-lg text-[#006a35]">were preparing</span>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="bg-[#eef0ff] p-8 rounded-lg border-l-4 border-[#155ca5]">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[#155ca5]">✨</span>
                <h3 className="font-['Nunito'] font-bold text-xl text-[#1e2e51]">Giải thích chi tiết</h3>
              </div>
              <div className="space-y-4 text-[#4c5b81] leading-relaxed">
                <p>
                  Mặc dù hành động chuẩn bị diễn ra trước khi giáo sư đến, câu này nhấn mạnh vào một hành động đang tiếp diễn tại một thời điểm xác định trong quá khứ.
                </p>
                <div className="bg-white/50 p-4 rounded-lg font-mono text-sm border border-[#9eacd7]/20">
                  <span className="font-bold text-[#155ca5]">Key Rule:</span> "By the time" + Simple Past can be used with Past Continuous if emphasizing ongoing action.
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="mt-10 flex justify-between items-center pt-8 border-t border-[#dae2ff]">
              <button className="flex items-center gap-2 font-bold text-[#155ca5] hover:-translate-x-1 transition-transform">
                <ArrowLeft size={20} />
                Previous Question
              </button>
              <div className="flex gap-4">
                <button className="bg-[#dae2ff] px-6 py-3 rounded-md font-bold text-[#1e2e51] hover:bg-[#d1dcff] transition-colors flex items-center gap-2">
                  <Save size={18} />
                  Save to Review
                </button>
                <button className="bg-[#155ca5] text-white px-8 py-3 rounded-md font-bold shadow-lg shadow-[#155ca5]/20 hover:opacity-90 transition-opacity flex items-center gap-2">
                  Next Incorrect
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Related Concepts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-[#fed023]/10 p-6 rounded-lg flex items-center gap-6">
              <div className="w-16 h-16 shrink-0 bg-[#fed023] rounded-lg flex items-center justify-center shadow-lg">
                <Lightbulb className="text-[#594700]" size={32} />
              </div>
              <div>
                <h4 className="font-bold text-[#594700]">Master the Past Continuous</h4>
                <p className="text-sm opacity-80 mb-2">You missed 3 questions on this topic. Ready for a quick drill?</p>
                <button className="text-[#6f5900] font-black text-xs uppercase tracking-wider">
                  Start Focused Practice →
                </button>
              </div>
            </div>
            <div className="bg-[#eef0ff] p-6 rounded-lg text-center">
              <div className="text-3xl font-black text-[#155ca5] mb-1">42</div>
              <div className="text-xs font-bold opacity-50 uppercase">Global Rank</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
