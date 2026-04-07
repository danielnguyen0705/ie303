import { Timer, Flame, Coins } from 'lucide-react';

export function RevisionTest() {
  return (
    <div className="min-h-screen bg-[#f6f6ff]">
      {/* Header */}
      <header className="flex justify-between items-center w-full px-6 py-3 sticky top-0 z-50 bg-[#f6f6ff]/80 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-black tracking-tighter text-[#155ca5]">UIFIVE</h1>
          <nav className="hidden md:flex items-center gap-6">
            <a className="text-slate-500 font-medium hover:text-[#155ca5] transition-all" href="#">Learn</a>
            <a className="text-[#155ca5] border-b-2 border-[#155ca5] font-bold pb-1" href="#">Quests</a>
            <a className="text-slate-500 font-medium hover:text-[#155ca5] transition-all" href="#">Leaderboard</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-[#fed023]/20 px-3 py-1.5 rounded-full gap-2 hover:scale-105 transition-transform cursor-pointer">
            <Flame className="text-[#6f5900]" size={18} fill="currentColor" />
            <span className="font-mono font-bold text-[#594700]">12</span>
          </div>
          <div className="flex items-center bg-yellow-100 px-3 py-1.5 rounded-full gap-2 hover:scale-105 transition-transform cursor-pointer">
            <Coins className="text-yellow-600" size={18} />
            <span className="font-mono font-bold text-yellow-800">2,450</span>
          </div>
          <div className="h-10 w-10 rounded-full border-2 border-[#73aaf9] overflow-hidden ring-2 ring-[#155ca5]/10 bg-slate-200"></div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-72px)]">
        {/* Left Column: Reading Passage */}
        <section className="lg:w-1/2 flex flex-col gap-6">
          <div className="bg-white p-8 rounded-lg shadow-sm border border-[#9eacd7]/10">
            <div className="flex items-center justify-between mb-6">
              <span className="bg-[#155ca5]/10 text-[#155ca5] px-4 py-1 rounded-full text-sm font-bold">
                Reading Passage 1
              </span>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-xs font-mono">1,200 Words</span>
              </div>
            </div>
            
            <h2 className="font-['Nunito'] text-3xl font-extrabold leading-tight text-[#1e2e51] mb-6">
              The impact of climate change on butterflies in Britain
            </h2>

            <div className="relative w-full h-64 rounded-lg overflow-hidden my-4 bg-gradient-to-br from-orange-200 to-purple-300"></div>

            <div className="space-y-4 text-[#1e2e51]/80 leading-relaxed">
              <p className="first-letter:text-5xl first-letter:font-bold first-letter:text-[#155ca5] first-letter:mr-3 first-letter:float-left">
                Over the past century, the British landscape has undergone significant transformations.
              </p>
              <p>
                Recent studies conducted by the University of York suggest that the distribution of many butterfly species is shifting northwards at a rate of roughly 20 kilometres per decade.
              </p>
              <p>
                Moreover, the phenology—or timing of biological events—is changing. Butterflies are emerging earlier in the spring, which creates a potential "mismatch" with the flowering plants they depend on.
              </p>
            </div>
          </div>
        </section>

        {/* Right Column: Questions */}
        <section className="lg:w-1/2 flex flex-col gap-6">
          {/* Timer Header */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-[#9eacd7]/10 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#fb5151]/10 rounded-xl">
                <Timer className="text-[#b31b25]" size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Time Remaining</p>
                <p className="font-mono text-2xl font-black text-[#b31b25]">59:22</p>
              </div>
            </div>
            <button className="bg-[#b31b25] text-white px-8 py-3 rounded-md font-bold hover:bg-[#9f0519] transition-all shadow-lg shadow-[#b31b25]/20 active:scale-95">
              Nộp bài
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Questions */}
            <div className="md:col-span-8 flex flex-col gap-4 max-h-[700px] overflow-y-auto pr-2">
              <div className="sticky top-0 bg-[#f6f6ff]/80 backdrop-blur-md py-2 z-10">
                <h3 className="font-['Nunito'] font-bold text-lg">Questions 1-6</h3>
                <p className="text-sm text-slate-500 italic">Do the following statements agree with the passage?</p>
              </div>

              {/* Question Cards */}
              {[
                { id: 1, text: 'The Comma butterfly has struggled to adapt to the warming climate.', selected: 'TRUE' },
                { id: 2, text: 'Specialist butterflies are more vulnerable to habitat loss.', selected: 'TRUE', answered: true },
                { id: 3, text: 'The High Brown Fritillary is thriving in urbanised areas.', selected: null },
                { id: 4, text: 'Spring emergence timing is remaining constant.', selected: null, flagged: true },
              ].map((q) => (
                <div
                  key={q.id}
                  className={`bg-white p-6 rounded-lg border-2 transition-colors shadow-sm ${
                    q.answered ? 'border-[#155ca5]' : q.flagged ? 'border-[#6f5900]' : 'border-transparent hover:border-[#73aaf9]/50'
                  } relative`}
                >
                  {q.answered && (
                    <div className="absolute top-2 right-2">
                      <span className="text-[#155ca5]">✓</span>
                    </div>
                  )}
                  {q.flagged && (
                    <div className="absolute top-2 right-2">
                      <span className="text-[#6f5900]">🚩</span>
                    </div>
                  )}
                  <div className="flex gap-4">
                    <span className="font-mono font-black text-[#155ca5] text-xl">
                      {q.id.toString().padStart(2, '0')}
                    </span>
                    <p className="text-[#1e2e51] font-medium leading-snug">{q.text}</p>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {['TRUE', 'FALSE', 'NOT GIVEN'].map((option) => (
                      <button
                        key={option}
                        className={`px-5 py-2 rounded-full border-2 font-bold transition-all text-sm ${
                          q.selected === option
                            ? 'bg-[#155ca5] text-white border-[#155ca5] shadow-md'
                            : 'border-[#9eacd7] text-[#67769e] hover:border-[#155ca5] hover:text-[#155ca5]'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Sidebar */}
            <aside className="md:col-span-4 flex flex-col gap-6">
              <div className="bg-[#eef0ff] p-6 rounded-lg">
                <h4 className="font-['Nunito'] font-bold text-sm text-slate-600 uppercase tracking-wider mb-4">
                  Question Grid
                </h4>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-[#155ca5]"></div>
                    <span className="text-[10px] font-bold text-slate-500">Done</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-[#6f5900]"></div>
                    <span className="text-[10px] font-bold text-slate-500">Flagged</span>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 50 }, (_, i) => {
                    const answered = i < 2;
                    const flagged = i === 3;
                    const current = i === 0;
                    return (
                      <button
                        key={i}
                        className={`w-full aspect-square flex items-center justify-center font-mono text-xs rounded-full font-bold transition-all ${
                          current
                            ? 'bg-[#155ca5] text-white ring-2 ring-[#155ca5] ring-offset-2'
                            : answered
                            ? 'bg-[#155ca5] text-white'
                            : flagged
                            ? 'bg-[#6f5900] text-white'
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-[#155ca5]'
                        }`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-8 p-4 bg-[#155ca5]/5 rounded-xl border border-[#155ca5]/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-[#155ca5] uppercase">Progress</span>
                    <span className="text-xs font-mono font-bold text-[#155ca5]">2/50</span>
                  </div>
                  <div className="w-full h-2 bg-[#155ca5]/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#155ca5] rounded-full w-[4%]"></div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
