import { Link } from "react-router";
import { X, Clock, CheckCircle } from "lucide-react";
import { useState } from "react";

export function ReadingExercise() {
  const [selectedAnswer, setSelectedAnswer] = useState<string>("A");
  const [showFeedback, setShowFeedback] = useState(true);

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f6ff]">
      {/* Header */}
      <nav className="fixed top-0 z-50 bg-white/80 backdrop-blur-xl shadow-sm w-full">
        <div className="flex justify-between items-center w-full px-6 py-4">
          <div className="text-lg font-bold text-[#155ca5] tracking-tighter">
            UIFIVE
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <span className="text-[#155ca5] font-bold text-sm tracking-tight">
              Unit 1 — Phase I — Lesson 1/6
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 transition-all duration-200 rounded-full">
              <Clock className="w-6 h-6 text-gray-600" />
            </button>
            <Link
              to="/unit/1"
              className="p-2 hover:bg-red-50 hover:text-[#b31b25] transition-all duration-200 rounded-full"
            >
              <X className="w-6 h-6 text-gray-600" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content Canvas: 2 Columns */}
      <main className="flex-grow flex flex-col md:flex-row mt-20 mb-32 overflow-hidden px-4 md:px-8 gap-6">
        {/* Left Column: Scrollable Article */}
        <section className="flex-1 overflow-y-auto bg-white p-6 rounded-lg shadow-sm">
          <header className="mb-8">
            <span className="bg-[#fed023]/20 text-[#594700] px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 inline-block">
              Reading Passage
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight mb-6">
              The Blue Zones
            </h1>
            <div className="w-full h-64 rounded-lg overflow-hidden mb-6 bg-gray-200">
              <div className="w-full h-full flex items-center justify-center text-6xl">
                🏝️
              </div>
            </div>
          </header>
          <article className="prose max-w-none text-gray-700 leading-relaxed space-y-6 text-lg">
            <p>
              In the quiet hills of Sardinia, Italy, and the sun-drenched
              coastal villages of Okinawa, Japan, researchers have discovered a
              remarkable phenomenon. These regions, dubbed{" "}
              <strong>"Blue Zones,"</strong> are home to the highest
              concentrations of centenarians in the world.
            </p>
            <p>
              Dan Buettner, a National Geographic Fellow who pioneered the study
              of these areas, identified nine specific lifestyle habits shared
              by people in these regions. Interestingly, none of these habits
              involve rigorous gym memberships or restrictive dieting fads
              common in Western cultures.
            </p>
            <div className="bg-gray-50 p-6 rounded-lg my-8">
              <h3 className="font-bold text-[#155ca5] mb-2">Did you know?</h3>
              <p className="text-base italic">
                In Okinawa, the concept of 'Ikigai'—the reason for which you
                wake up in the morning—is considered as vital to longevity as
                physical health.
              </p>
            </div>
            <p>
              Instead, residents of Blue Zones engage in what experts call
              "Natural Movement." Their environments are set up in a way that
              nudges them into moving every 20 minutes. They garden, they walk
              to the market, and they knead their own bread. This constant,
              low-intensity physical activity keeps their cardiovascular systems
              healthy without the inflammation often associated with high-impact
              exercise.
            </p>
            <p>
              Social connectivity also plays a crucial role. In Sardinia, the
              elderly are highly celebrated and integrated into daily family
              life, preventing the isolation and cognitive decline often seen in
              other developed nations. Their diet, largely plant-based and rich
              in local legumes and grains, further reinforces their biological
              resilience.
            </p>
          </article>
        </section>

        {/* Right Column: MCQ Area */}
        <section className="flex-1 flex flex-col justify-center bg-white p-8 rounded-lg shadow-sm">
          <div className="max-w-xl mx-auto w-full">
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[#155ca5]">📝</span>
                <span className="text-gray-600 font-medium tracking-wide">
                  QUESTION 1 OF 5
                </span>
              </div>
              <h2 className="text-2xl font-bold leading-snug">
                What is a common characteristic of Blue Zones?
              </h2>
            </div>

            {/* Multiple Choice Options */}
            <div className="space-y-4">
              {/* Option A: Selected/Correct */}
              <button
                onClick={() => setSelectedAnswer("A")}
                className={`w-full flex items-center p-5 rounded-full transition-all duration-200 ${
                  selectedAnswer === "A"
                    ? "bg-[#155ca5] text-white border-2 border-[#155ca5]"
                    : "bg-transparent text-gray-800 border-2 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mr-4 shrink-0 ${
                    selectedAnswer === "A"
                      ? "bg-white text-[#155ca5]"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  A
                </span>
                <span className="text-lg font-medium text-left">
                  Regular, low-intensity physical activity
                </span>
                {selectedAnswer === "A" && (
                  <CheckCircle className="w-6 h-6 ml-auto" />
                )}
              </button>

              {/* Option B */}
              <button
                onClick={() => setSelectedAnswer("B")}
                className="w-full flex items-center p-5 rounded-full bg-transparent text-gray-800 border-2 border-gray-300 hover:bg-gray-50 transition-all duration-200"
              >
                <span className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold mr-4 shrink-0">
                  B
                </span>
                <span className="text-lg font-medium text-left">
                  Strict adherence to high-protein keto diets
                </span>
              </button>

              {/* Option C */}
              <button
                onClick={() => setSelectedAnswer("C")}
                className="w-full flex items-center p-5 rounded-full bg-transparent text-gray-800 border-2 border-gray-300 hover:bg-gray-50 transition-all duration-200"
              >
                <span className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold mr-4 shrink-0">
                  C
                </span>
                <span className="text-lg font-medium text-left">
                  Living in highly urbanized environments
                </span>
              </button>

              {/* Option D */}
              <button
                onClick={() => setSelectedAnswer("D")}
                className="w-full flex items-center p-5 rounded-full bg-transparent text-gray-800 border-2 border-gray-300 hover:bg-gray-50 transition-all duration-200"
              >
                <span className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold mr-4 shrink-0">
                  D
                </span>
                <span className="text-lg font-medium text-left">
                  Exclusive use of modern medical technology
                </span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer: Feedback Card */}
      {showFeedback && (
        <footer className="fixed bottom-0 left-0 right-0 p-6 bg-white shadow-2xl border-t border-gray-100">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            {/* State: Correct Feedback */}
            <div className="flex items-center gap-6 bg-[#27ae60]/10 border-l-4 border-[#27ae60] p-6 rounded-r-lg w-full md:w-auto">
              <div className="bg-[#27ae60] text-white w-14 h-14 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-[#006a35] font-extrabold text-xl">
                  Great job!
                </h4>
                <p className="text-gray-700 font-medium">
                  Regular physical activity is indeed a key factor.
                </p>
              </div>
            </div>
            {/* Continue Button */}
            <button className="w-full md:w-auto px-12 py-5 bg-[#155ca5] text-white rounded-full font-bold text-xl shadow-lg shadow-[#155ca5]/20 hover:scale-[1.02] active:scale-95 transition-transform">
              Continue
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
