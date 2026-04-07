import { Link } from "react-router";
import { X, Clock, CheckCircle, ArrowRight } from "lucide-react";
import { useState } from "react";

export function QuizExercise() {
  const [selectedAnswer, setSelectedAnswer] = useState<string>("C");

  return (
    <div className="min-h-screen bg-[#f5f8fc] text-gray-900 font-body flex flex-col overflow-x-hidden">
      {/* Quiz Header */}
      <header className="w-full bg-white/90 backdrop-blur-xl sticky top-0 z-50 px-6 py-4 flex justify-between items-center max-w-screen-2xl mx-auto border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#155ca5]/10 rounded-lg flex items-center justify-center text-[#155ca5]">
            <span className="text-2xl">🎓</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Kinetic Scholar
            </span>
            <span className="text-sm font-extrabold">
              Unit 1 — Phần V — Bài 3/10
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full border border-gray-200">
            <Clock className="w-4 h-4 text-[#155ca5]" />
            <span className="font-mono text-sm font-bold text-[#155ca5]">
              12:45
            </span>
          </div>
          <Link
            to="/unit/1"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 hover:text-[#b31b25] transition-all duration-200"
          >
            <X className="w-6 h-6" />
          </Link>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-gray-200">
        <div className="h-full bg-[#155ca5] w-[30%] transition-all duration-500" />
      </div>

      {/* Main Question Area */}
      <main className="flex-grow flex flex-col items-center justify-center p-6 md:p-12 max-w-4xl mx-auto w-full">
        {/* Question Card */}
        <div className="w-full bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-gray-100 relative mb-8 transition-all">
          <div className="absolute -top-4 -left-4 bg-[#fed023] text-[#594700] px-4 py-1.5 rounded-full text-xs font-black shadow-md flex items-center gap-2">
            <span className="text-sm">⭐</span>
            CHALLENGE
          </div>
          <div className="mb-10">
            <span className="text-gray-500 text-sm font-bold uppercase tracking-wider block mb-2">
              Instructions
            </span>
            <h2 className="text-xl md:text-2xl font-bold leading-tight">
              Choose the correct word: <br />
              <span className="font-mono bg-[#155ca5]/5 border border-[#155ca5]/10 px-3 py-1.5 rounded-lg text-[#155ca5] mt-4 inline-block">
                Regular exercise helps to ______ your health.
              </span>
            </h2>
          </div>

          {/* Choices Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option A */}
            <button
              onClick={() => setSelectedAnswer("A")}
              className="group flex items-center justify-between p-5 rounded-full border-2 border-gray-200 bg-gray-50 hover:border-[#155ca5]/30 hover:bg-white hover:shadow-md transition-all duration-200 text-left"
            >
              <div className="flex items-center gap-4">
                <span className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center font-mono font-bold text-gray-500 group-hover:bg-[#155ca5]/10 group-hover:text-[#155ca5] group-hover:border-[#155ca5]/20 transition-colors">
                  A
                </span>
                <span className="font-bold">improve</span>
              </div>
            </button>

            {/* Option B */}
            <button
              onClick={() => setSelectedAnswer("B")}
              className="group flex items-center justify-between p-5 rounded-full border-2 border-gray-200 bg-gray-50 hover:border-[#155ca5]/30 hover:bg-white hover:shadow-md transition-all duration-200 text-left"
            >
              <div className="flex items-center gap-4">
                <span className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center font-mono font-bold text-gray-500 group-hover:bg-[#155ca5]/10 group-hover:text-[#155ca5] group-hover:border-[#155ca5]/20 transition-colors">
                  B
                </span>
                <span className="font-bold">increase</span>
              </div>
            </button>

            {/* Option C (Active) */}
            <button
              onClick={() => setSelectedAnswer("C")}
              className="group flex items-center justify-between p-5 rounded-full border-2 border-[#155ca5] bg-[#155ca5]/5 shadow-sm text-left"
            >
              <div className="flex items-center gap-4">
                <span className="w-10 h-10 rounded-full bg-[#155ca5] flex items-center justify-center font-mono font-bold text-white shadow-lg shadow-[#155ca5]/30">
                  C
                </span>
                <span className="font-bold text-[#155ca5]">enhance</span>
              </div>
              <CheckCircle className="w-6 h-6 text-[#155ca5]" />
            </button>

            {/* Option D */}
            <button
              onClick={() => setSelectedAnswer("D")}
              className="group flex items-center justify-between p-5 rounded-full border-2 border-gray-200 bg-gray-50 hover:border-[#155ca5]/30 hover:bg-white hover:shadow-md transition-all duration-200 text-left"
            >
              <div className="flex items-center gap-4">
                <span className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center font-mono font-bold text-gray-500 group-hover:bg-[#155ca5]/10 group-hover:text-[#155ca5] group-hover:border-[#155ca5]/20 transition-colors">
                  D
                </span>
                <span className="font-bold">growing</span>
              </div>
            </button>
          </div>
        </div>
      </main>

      {/* Feedback Section (Bottom Drawer) */}
      <div className="w-full bg-white border-t border-gray-200 p-6 md:p-8 mt-auto sticky bottom-0 z-40 shadow-2xl">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6">
          {/* Feedback Card */}
          <div className="flex-grow w-full bg-green-50 border border-green-200 rounded-2xl p-6 flex items-start gap-4">
            <div className="bg-[#27ae60] text-white w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-[#27ae60]/30">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-[#27ae60] font-black text-xl">
                  Chính xác!
                </h3>
                <span className="bg-[#27ae60] text-white px-2 py-0.5 rounded text-[10px] font-bold">
                  +10 XP
                </span>
              </div>
              <p className="text-gray-700 font-medium text-sm leading-relaxed">
                <span className="font-bold text-[#27ae60]">Enhance</span> là
                động từ phù hợp nhất khi nói về việc cải thiện chất lượng hoặc
                sức mạnh của một thứ gì đó như sức khỏe (health).
              </p>
            </div>
          </div>
          {/* Primary Action Button */}
          <button className="w-full md:w-auto min-w-[200px] h-16 bg-[#155ca5] text-white rounded-2xl font-black text-lg shadow-xl shadow-[#155ca5]/25 hover:bg-[#005095] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 group">
            Tiếp tục
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Background Decoration Elements */}
      <div className="fixed top-20 right-[-5%] w-96 h-96 bg-[#155ca5]/5 rounded-full blur-[100px] -z-10" />
      <div className="fixed bottom-10 left-[-10%] w-80 h-80 bg-[#f1c40f]/5 rounded-full blur-[100px] -z-10" />
    </div>
  );
}
