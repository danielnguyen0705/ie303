import { Play, ArrowRight, X, Clock } from 'lucide-react';
import { useState } from 'react';

export function ListeningExercise() {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const words = ['Longevity', 'is', 'linked', 'to', 'diet'];

  return (
    <div className="min-h-screen bg-[#f6f6ff] selection:bg-[#73aaf9]">
      {/* TopAppBar */}
      <header className="fixed top-0 z-50 w-full flex justify-between items-center px-6 py-4 bg-[#f6f6ff]">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-[#155ca5] tracking-tighter">UIFIVE</span>
          <div className="hidden md:flex items-center gap-2">
            <span className="text-[#155ca5] font-bold font-['Lexend'] text-sm tracking-tight">
              Unit 1 — Phase I — Lesson 1/6
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-red-50 hover:text-[#b31b25] transition-colors duration-200">
            <Clock className="text-[#1e2e51]" size={20} />
          </button>
          <button className="p-2 rounded-full hover:bg-red-50 hover:text-[#b31b25] transition-colors duration-200">
            <X className="text-[#1e2e51]" size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 md:px-8 max-w-5xl mx-auto flex flex-col items-center">
        {/* Lesson Header */}
        <div className="w-full mb-10 pl-6 md:pl-12">
          <span className="inline-flex items-center px-4 py-1 bg-[#fed023] text-[#594700] rounded-full text-xs font-bold tracking-widest uppercase mb-4">
            Listening Lab
          </span>
          <h1 className="font-['Nunito'] text-3xl md:text-4xl font-extrabold text-[#1e2e51] tracking-tight max-w-2xl leading-tight">
            Mastering the <span className="text-[#155ca5] italic">Syllabic Rhythms</span> of Longevity Science
          </h1>
        </div>

        {/* Main Task Card */}
        <div className="w-full bg-white rounded-lg shadow-[0_20px_40px_-15px_rgba(30,46,81,0.08)] p-8 md:p-12 relative overflow-hidden">
          {/* Decorative Accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#73aaf9]/10 rounded-bl-full -mr-16 -mt-16"></div>

          {/* Audio Player Section */}
          <div className="flex flex-col items-center mb-12">
            <div className="relative group">
              <button className="w-24 h-24 bg-[#155ca5] rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform z-10 relative">
                <Play className="text-white fill-white ml-1" size={32} />
              </button>
              {/* Pulse effect */}
              <div className="absolute inset-0 rounded-full bg-[#155ca5]/20 animate-ping opacity-20 scale-125"></div>
            </div>
            
            <div className="w-full max-w-md mt-10">
              <div className="h-2 w-full bg-[#d1dcff] rounded-full overflow-hidden">
                <div className="h-full bg-[#155ca5] w-1/3 rounded-full"></div>
              </div>
              <div className="flex justify-between mt-3 text-xs font-mono text-[#67769e]">
                <span>0:14</span>
                <span>0:42</span>
              </div>
            </div>
          </div>

          {/* WordSort Task */}
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#75f39c] flex items-center justify-center text-[#006a35]">
                <span className="text-lg">⇅</span>
              </div>
              <h2 className="font-['Nunito'] text-xl font-bold text-[#1e2e51]">Listen and arrange the sentence.</h2>
            </div>

            {/* Result Area */}
            <div className="min-h-[140px] w-full border-2 border-dashed border-[#9eacd7]/30 rounded-lg bg-[#eef0ff]/50 p-6 flex flex-wrap gap-3 items-center content-center justify-center">
              {selectedWords.length === 0 ? (
                <span className="text-[#9eacd7] font-medium italic opacity-60">Drag words here...</span>
              ) : (
                selectedWords.map((word, idx) => (
                  <div key={idx} className="px-6 py-3 bg-[#73aaf9] text-white font-['Nunito'] font-bold rounded-full">
                    {word}
                  </div>
                ))
              )}
            </div>

            {/* Draggable Word Chips */}
            <div className="flex flex-wrap justify-center gap-4 py-4">
              {words.map((word, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedWords([...selectedWords, word])}
                  className="px-8 py-4 bg-[#73aaf9] text-[#002a54] font-['Nunito'] font-bold rounded-full shadow-sm hover:scale-105 active:scale-90 transition-all border border-[#155ca5]/10"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Footer */}
        <div className="w-full mt-12 flex flex-col md:flex-row items-center justify-between gap-6 px-4">
          <div className="flex items-center gap-4 order-2 md:order-1">
            <div className="flex -space-x-2">
              {[1, 2].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-[#75f39c] flex items-center justify-center">
                  <span className="text-[#006a35] text-sm">✓</span>
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-white bg-[#73aaf9] flex items-center justify-center ring-4 ring-[#155ca5]/10">
                <span className="text-xs font-bold text-white">3</span>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-white bg-[#d1dcff] flex items-center justify-center">
                <span className="text-xs font-bold text-[#67769e]">4</span>
              </div>
            </div>
            <span className="text-sm font-bold text-[#9eacd7] ml-2">Progress: Step 3 of 6</span>
          </div>
          
          <div className="flex items-center gap-4 order-1 md:order-2 w-full md:w-auto">
            <button className="px-6 py-4 text-[#155ca5] font-bold hover:bg-[#155ca5]/5 rounded-full transition-colors">
              Skip
            </button>
            <button className="flex-1 md:flex-none px-12 py-4 bg-[#155ca5] text-white font-['Nunito'] font-extrabold rounded-full shadow-lg shadow-[#155ca5]/20 hover:scale-105 transition-transform flex items-center justify-center gap-2">
              Check Answer
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        {/* Pro Tip */}
        <div className="mt-16 flex items-center gap-6 p-6 bg-[#eef0ff] rounded-lg max-w-md self-start relative">
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#fed023] rounded-full flex items-center justify-center shadow-md">
            <span className="text-[#594700]">★</span>
          </div>
          <div className="w-20 h-20 rounded-full bg-slate-200 flex-shrink-0"></div>
          <div>
            <p className="font-mono text-[10px] text-[#155ca5] uppercase font-bold tracking-widest mb-1">PRO TIP</p>
            <p className="text-[#4c5b81] text-sm leading-relaxed">
              Listen for the <span className="font-mono bg-[#dae2ff] px-1 rounded">/ləndʒɛvɪti/</span> stress pattern. 
              It often follows a rhythmic drop before the predicate.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
