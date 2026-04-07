import { Link, useParams } from "react-router";
import { ArrowLeft, CheckCircle, Lock, Lightbulb } from "lucide-react";
import { ProgressBar } from "../components/ProgressBar";

export function UnitView() {
  const { unitId } = useParams();

  const phases = [
    { id: "I", completed: true, current: false },
    { id: "II", completed: true, current: false },
    { id: "III", completed: true, current: false },
    { id: "IV", completed: true, current: false },
    { id: "V", completed: false, current: true },
    { id: "VI", completed: false, current: false },
    { id: "VII", completed: false, current: false },
    { id: "VIII", completed: false, current: false },
    { id: "IX", completed: false, current: false },
  ];

  const lessons = [
    {
      id: 1,
      phase: "V",
      title: "Reading: The Blue Zones",
      description: "Learn about the world's longest-lived people and the secrets to their healthy lifestyles.",
      xp: 10,
      completed: false,
      locked: false,
      current: true,
      type: "reading",
    },
    {
      id: 2,
      phase: "V",
      title: "Vocabulary",
      description: "Key vocabulary related to health and longevity",
      xp: 10,
      completed: true,
      locked: false,
      current: false,
      type: "vocabulary",
    },
    {
      id: 3,
      phase: "V",
      title: "Grammar Focus",
      description: "Conditional sentences and modal verbs for health advice",
      xp: 15,
      completed: false,
      locked: true,
      current: false,
      type: "grammar",
    },
    {
      id: 4,
      phase: "V",
      title: "Listening Lab",
      description: "Interview with a centenarian from Okinawa, Japan",
      xp: 15,
      completed: false,
      locked: true,
      current: false,
      type: "listening",
    },
  ];

  return (
    <main className="max-w-5xl mx-auto py-8 px-4 pb-20">
      {/* Header */}
      <section className="mb-12">
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/"
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <span className="text-sm font-bold text-[#155ca5] uppercase tracking-wider">
              Current Module
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Unit {unitId}: A long and healthy life
            </h1>
          </div>
        </div>
        <div className="w-full md:w-64">
          <ProgressBar value={45} label="Course Progress" />
        </div>
      </section>

      {/* Phase Navigator */}
      <section className="mb-12">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {phases.map((phase) => (
            <button
              key={phase.id}
              className={`w-14 h-14 rounded-full flex items-center justify-center font-bold transition-all ${
                phase.completed
                  ? "bg-[#27ae60] text-white shadow-lg"
                  : phase.current
                  ? "bg-[#155ca5] text-white shadow-xl scale-110 animate-pulse"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              {phase.completed ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <span className="text-xl">{phase.id}</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Lesson Cards */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start mb-12">
        {/* Primary Focus Card (Current Lesson) */}
        <div className="md:col-span-8 bg-[#27ae60] rounded-3xl p-8 relative overflow-hidden shadow-xl group transition-all hover:scale-[1.01]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
            <div className="w-40 h-40 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30 shrink-0">
              <span className="text-6xl">📚</span>
            </div>
            <div className="text-center md:text-left">
              <div className="inline-block bg-white/20 backdrop-blur-md px-4 py-1 rounded-full mb-4">
                <span className="text-xs font-bold text-white uppercase tracking-widest">
                  Reading Section
                </span>
              </div>
              <h3 className="text-3xl font-black text-white mb-2 leading-tight">
                Reading: The Blue Zones
              </h3>
              <p className="text-white/90 mb-6 text-sm max-w-sm">
                Learn about the world's longest-lived people and the secrets to
                their healthy lifestyles.
              </p>
              <div className="flex items-center gap-4">
                <Link
                  to="/exercise/reading"
                  className="bg-white text-[#27ae60] px-8 py-4 rounded-full font-black text-lg shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2"
                >
                  BẮT ĐẦU
                  <span className="bg-[#75f39c]/30 px-2 py-0.5 rounded-full text-sm">
                    +10 XP
                  </span>
                </Link>
                <span className="text-white font-bold text-sm">
                  Bài học 1 / 6
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Cards Column */}
        <div className="md:col-span-4 space-y-4">
          {/* Completed Card */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border-l-8 border-[#27ae60]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-bold text-[#27ae60] uppercase tracking-widest">
                  Completed
                </span>
                <h4 className="text-lg font-black">Vocabulary</h4>
              </div>
              <div className="w-10 h-10 bg-[#75f39c]/30 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-[#00592b]" />
              </div>
            </div>
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#27ae60] w-full rounded-full" />
            </div>
          </div>

          {/* Locked Cards */}
          <div className="bg-gray-100 p-6 rounded-3xl opacity-80">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Locked
                </span>
                <h4 className="text-lg font-black text-slate-400">
                  Grammar Focus
                </h4>
              </div>
              <Lock className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-400">
              Conditional sentences and modal verbs for health advice.
            </p>
          </div>

          <div className="bg-gray-100 p-6 rounded-3xl opacity-80">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Locked
                </span>
                <h4 className="text-lg font-black text-slate-400">
                  Listening Lab
                </h4>
              </div>
              <Lock className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-400">
              Interview with a centenarian from Okinawa, Japan.
            </p>
          </div>
        </div>
      </section>

      {/* Pronunciation Tip */}
      <section>
        <div className="bg-[#73aaf9]/20 p-6 rounded-3xl border border-[#155ca5]/10 flex flex-col md:flex-row items-center gap-6">
          <Lightbulb className="w-12 h-12 text-[#f1c40f]" />
          <div>
            <h5 className="font-black text-[#155ca5] mb-1">
              Weekly Pronunciation Tip
            </h5>
            <p className="text-sm text-[#155ca5]/80">
              When saying "Longevity", focus on the second syllable:{" "}
              <span className="font-mono bg-white/60 px-2 py-0.5 rounded-full text-[#155ca5] mx-1">
                /lɒnˈdʒev.ə.ti/
              </span>
              . The 'g' sounds like a 'j'!
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
