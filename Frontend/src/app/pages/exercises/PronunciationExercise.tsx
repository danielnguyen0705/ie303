import { Link } from "react-router";
import { X, Clock, Volume2, Mic, Lightbulb } from "lucide-react";

export function PronunciationExercise() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f6f6ff]">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="flex justify-between items-center w-full px-6 py-4">
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold text-[#155ca5] tracking-tighter">
              UIFIVE
            </span>
            <div className="hidden md:block h-6 w-[1px] bg-gray-300" />
            <span className="font-medium text-sm tracking-tight text-[#155ca5]">
              Unit 1 — Phase I — Lesson 1/6
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Clock className="w-6 h-6 text-gray-600" />
            </button>
            <Link
              to="/unit/1"
              className="p-2 rounded-full hover:bg-red-50 hover:text-[#b31b25] transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-gray-200">
        <div className="h-full bg-[#155ca5] w-1/3 rounded-r-full" />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 max-w-5xl mx-auto w-full">
        <div className="w-full bg-white rounded-lg p-8 md:p-16 shadow-sm flex flex-col items-center gap-12">
          {/* Character & Speech Bubble */}
          <div className="flex flex-col items-center w-full gap-8">
            {/* Speech Bubble */}
            <div className="relative bg-gray-50 p-6 md:px-10 md:py-8 rounded-xl max-w-2xl text-center">
              <p className="text-2xl md:text-4xl font-bold tracking-tight">
                How long do they live?
              </p>
              {/* IPA Transcript */}
              <p className="mt-4 font-mono text-[#155ca5] font-medium text-lg md:text-xl tracking-widest">
                /haʊ lɒŋ du ðeɪ lɪv/
              </p>
              {/* Bubble Tail */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-gray-50 rotate-45 rounded-sm" />
            </div>

            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-gray-200 border-4 border-white overflow-hidden">
                <div className="w-full h-full flex items-center justify-center text-6xl">
                  👨‍🏫
                </div>
              </div>
              {/* Streak Badge */}
              <div className="absolute -bottom-2 -right-2 bg-[#fed023] text-[#594700] px-4 py-1.5 rounded-full flex items-center gap-1 shadow-md">
                <span className="text-base">⚡</span>
                <span className="text-xs font-bold">STREAK x5</span>
              </div>
            </div>
          </div>

          {/* Action Section */}
          <div className="flex flex-col items-center gap-6 w-full max-w-sm">
            {/* Recording Instruction */}
            <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
              CLICK TO START SPEAKING
            </p>

            {/* Main Record Button */}
            <button className="w-full aspect-square md:aspect-auto md:h-24 bg-[#155ca5] hover:bg-[#005095] text-white rounded-full flex items-center justify-center gap-4 transition-all duration-300 transform hover:scale-[1.03] active:scale-95 shadow-xl shadow-[#155ca5]/20">
              <Mic className="w-10 h-10 md:w-12 md:h-12" />
              <span className="text-xl md:text-2xl font-extrabold tracking-tight hidden md:inline">
                TAP TO RECORD
              </span>
            </button>

            {/* Audio Playback Reference */}
            <button className="flex items-center gap-2 text-[#155ca5] font-bold hover:bg-[#73aaf9]/10 px-6 py-3 rounded-full transition-colors">
              <Volume2 className="w-5 h-5" />
              <span>Listen to example</span>
            </button>
          </div>
        </div>

        {/* Footer Guidance */}
        <div className="mt-12 w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-[#75f39c]/30 flex items-center justify-center shrink-0">
              <Lightbulb className="w-5 h-5 text-[#006a35]" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Pronunciation Tip</h4>
              <p className="text-xs text-gray-600 mt-1">
                Pay attention to the /v/ sound in "live". It should be voiced
                and clear.
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-[#73aaf9]/30 flex items-center justify-center shrink-0">
              <span className="text-xl">🌍</span>
            </div>
            <div>
              <h4 className="font-bold text-sm">Context</h4>
              <p className="text-xs text-gray-600 mt-1">
                Used when asking about the lifespan of animals or plants.
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg flex items-start gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-[#fed023]/30 flex items-center justify-center shrink-0">
              <span className="text-xl">🏆</span>
            </div>
            <div>
              <h4 className="font-bold text-sm">Potential Award</h4>
              <p className="text-xs text-gray-600 mt-1">
                Perfect score earns 20 bonus gold coins for your avatar!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
