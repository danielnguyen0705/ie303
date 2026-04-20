import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Flame,
  Coins,
  Zap,
  Target,
  Loader2,
  GraduationCap,
  BookOpen,
  Trophy,
  Star,
  Brain,
  FileText,
  Lock,
  Crown,
  ArrowRight,
} from "lucide-react";
import { getUserStats, getCurrentUser } from "@/api";
import { getAllGrades } from "@/api/admin";
import type { Grade } from "@/api/admin/types";

type UserProfile = {
  id: number;
  username: string;
  email: string;
  role: string;
  coin: number;
  exp: number;
  score: number;
  streak: number;
  lastStudyDate: string | null;
  vipExpiredAt: string | null;
  isVip: boolean;
  createdAt: string;
  studyingGrades: Array<{
    gradeId: number;
    gradeName: string;
    progressPercent: number;
  }>;
};

const gradeStyles = [
  {
    icon: GraduationCap,
    circle: "bg-gradient-to-br from-[#155ca5] to-[#005095] text-white",
    badge: "bg-[#155ca5]/10 text-[#155ca5]",
  },
  {
    icon: BookOpen,
    circle: "bg-gradient-to-br from-[#27ae60] to-[#1f8b4d] text-white",
    badge: "bg-[#27ae60]/10 text-[#27ae60]",
  },
  {
    icon: Trophy,
    circle: "bg-gradient-to-br from-[#f39c12] to-[#d68910] text-white",
    badge: "bg-[#f39c12]/10 text-[#f39c12]",
  },
  {
    icon: Star,
    circle: "bg-gradient-to-br from-[#8e44ad] to-[#6c3483] text-white",
    badge: "bg-[#8e44ad]/10 text-[#8e44ad]",
  },
];

const emptyStats = {
  totalLessonsCompleted: 0,
  totalXP: 0,
  totalCoins: 0,
  currentStreak: 0,
  accuracy: 0,
};

export function Dashboard() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [gradesResponse, userResponse, statsResponse] = await Promise.all([
        getAllGrades(),
        getCurrentUser(),
        getUserStats(),
      ]);

      if (gradesResponse.success && userResponse.success && statsResponse.success) {
        setGrades(gradesResponse.data ?? []);
        setUser((userResponse.data ?? null) as UserProfile | null);
        setStats(statsResponse.data ?? emptyStats);
      } else {
        setError("Failed to load dashboard data");
      }
    } catch (err) {
      console.error("Error loading dashboard:", err);
      setError("An error occurred while loading data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-10 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#155ca5] animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-bold">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-md font-bold hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  const displayName = user?.username || "Learner";
  const isVip = Boolean(user?.isVip);
  const currentStudyGrade =
    user?.studyingGrades
      ?.filter((item) => item.progressPercent > 0)
      .sort((left, right) => right.progressPercent - left.progressPercent)[0] ?? null;

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 space-y-10 pb-24 md:pb-12">
      <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#153d72_0%,#1f5aa6_55%,#73aaf9_120%)] p-8 md:p-10 text-white">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-[#fed023]/10 blur-3xl" />

          <div className="relative z-10 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em]">
                Learning Dashboard
              </span>
              <span
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] ${
                  isVip
                    ? "bg-[#fed023] text-[#594700]"
                    : "bg-white/10 text-white/85"
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                {isVip ? "VIP Active" : "Free Plan"}
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                Welcome back, {displayName}
              </h1>
              <p className="max-w-2xl text-lg text-white/85 leading-8">
                Keep your streak alive, pick the right grade, and jump straight
                into review tools that match your current progress.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-3xl bg-white/10 backdrop-blur-sm px-5 py-4">
                <Coins className="w-6 h-6 text-[#fed023] mb-3" fill="#fed023" />
                <div className="text-2xl font-black">
                  {stats.totalCoins.toLocaleString()}
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-white/65">
                  Coins
                </div>
              </div>

              <div className="rounded-3xl bg-white/10 backdrop-blur-sm px-5 py-4">
                <Zap className="w-6 h-6 text-white mb-3" />
                <div className="text-2xl font-black">
                  {stats.totalXP.toLocaleString()}
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-white/65">
                  EXP
                </div>
              </div>

              <div className="rounded-3xl bg-white/10 backdrop-blur-sm px-5 py-4">
                <Flame className="w-6 h-6 text-[#ffb347] mb-3" fill="#ffb347" />
                <div className="text-2xl font-black">{stats.currentStreak}</div>
                <div className="text-xs font-bold uppercase tracking-widest text-white/65">
                  Streak Days
                </div>
              </div>

              <div className="rounded-3xl bg-white/10 backdrop-blur-sm px-5 py-4">
                <Target className="w-6 h-6 text-[#9ef0b8] mb-3" />
                <div className="text-2xl font-black">{stats.accuracy}%</div>
                <div className="text-xs font-bold uppercase tracking-widest text-white/65">
                  Accuracy
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/leaderboard"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#153d72] hover:bg-[#f5f8ff]"
              >
                Open Leaderboard
                <ArrowRight className="w-4 h-4" />
              </Link>

              {!isVip && (
                <Link
                  to="/topup"
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
                >
                  Unlock VIP Tools
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm border border-slate-100">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#155ca5]">
                    Continue Learning
                  </p>
                  <h2 className="text-2xl font-black text-[#1e2e51] mt-2">
                    Choose Your Grade
                  </h2>
                </div>
                <Link
                  to="/leaderboard"
                  className="text-sm font-bold text-[#155ca5] hover:underline"
                >
                  Full Rank
                </Link>
              </div>

              <div className="mt-5 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {grades.map((grade, index) => {
                  const style = gradeStyles[index % gradeStyles.length];
                  const Icon = style.icon;
                  const studyingGrade = user?.studyingGrades?.find(
                    (item) => item.gradeId === grade.id,
                  );

                  return (
                    <Link
                      key={grade.id}
                      to={`/grades/${grade.id}/units`}
                      className="group rounded-3xl border border-slate-200 p-4 hover:border-[#155ca5]/25 hover:bg-[#f8fbff]"
                    >
                      <div
                        className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm ${style.circle}`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="mt-4 space-y-1">
                        <div className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${style.badge}`}>
                          Grade {grade.id}
                        </div>
                        <div className="font-black text-[#1e2e51]">
                          {grade.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {studyingGrade
                            ? `${Math.round(studyingGrade.progressPercent)}% progress`
                            : "Open learning path"}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              {currentStudyGrade && (
                <div className="mt-4 rounded-2xl bg-[#155ca5]/5 px-4 py-3 text-sm font-medium text-[#1e2e51]">
                  Currently studying:{" "}
                  <span className="font-black">{currentStudyGrade.gradeName}</span>
                  <span className="ml-2 text-[#155ca5] font-bold">
                    {Math.round(currentStudyGrade.progressPercent)}%
                  </span>
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-[#f8fbff] border border-[#dbeafe] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-[#1e2e51]">
                    Leaderboard Snapshot
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Stay close to the top with one more solid session.
                  </p>
                </div>
                <div className="rounded-2xl bg-[#155ca5] px-3 py-2 text-white text-center">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                    Rank
                  </div>
                  <div className="text-xl font-black">#{user?.score || 18}</div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 border border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-[#fed023] flex items-center justify-center text-xs font-black text-[#594700]">
                    1
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-[#1e2e51]">Elena P.</div>
                    <div className="text-xs text-gray-500">2,450 XP</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 border border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-black text-slate-700">
                    2
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-[#1e2e51]">Alex Wong</div>
                    <div className="text-xs text-gray-500">2,100 XP</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-[#155ca5]/10 px-4 py-3 border border-[#bfd8ff]">
                  <div className="w-8 h-8 rounded-full bg-[#155ca5] flex items-center justify-center text-xs font-black text-white">
                    You
                  </div>
                  <div className="flex-1">
                    <div className="font-black text-[#155ca5]">{displayName}</div>
                    <div className="text-xs text-[#155ca5]/80">
                      {stats.totalXP.toLocaleString()} XP - {stats.currentStreak} day streak
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-black text-[#1e2e51]">AI & Review Tools</h2>
          <p className="text-sm text-gray-500">
            Practice tools for users. Package creation still happens in the admin
            console, then learners reopen them here.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Link
            to={isVip ? "/ai/personalized-questions" : "#"}
            onClick={(event) => {
              if (!isVip) {
                event.preventDefault();
              }
            }}
            className={`relative rounded-[2rem] border p-6 transition-all ${
              isVip
                ? "bg-white border-slate-100 shadow-sm hover:shadow-md"
                : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            {!isVip && (
              <div className="absolute inset-0 rounded-[2rem] bg-white/35 backdrop-blur-[1px]" />
            )}
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-3">
                <Brain className={`w-8 h-8 ${isVip ? "text-[#155ca5]" : "text-slate-400"}`} />
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                    isVip
                      ? "bg-[#155ca5]/10 text-[#155ca5]"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isVip ? <Crown className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  {isVip ? "VIP" : "Locked"}
                </span>
              </div>
              <div className={`mt-5 font-black text-2xl ${isVip ? "text-[#1e2e51]" : "text-slate-500"}`}>
                Personalized Questions
              </div>
              <div className={`mt-2 text-sm ${isVip ? "text-gray-500" : "text-slate-500"}`}>
                Generate a fresh MCQ set from AI based on grade, unit range,
                and topic.
              </div>
              {!isVip && (
                <div className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Upgrade to VIP to use this tool
                </div>
              )}
            </div>
          </Link>

          <Link
            to="/reviews/unit"
            className="relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#f8fbff] to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <FileText className="w-8 h-8 text-[#155ca5]" />
                <span className="inline-flex items-center gap-1 rounded-full bg-[#155ca5]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#155ca5]">
                  Open
                </span>
              </div>
              <div className="mt-5 font-black text-2xl text-[#1e2e51]">
                Unit Reviews
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Open review packs that were created earlier. VIP only affects
                the extra wrong-question merge during review creation.
              </div>
            </div>
          </Link>

          <Link
            to={isVip ? "/reviews/group" : "#"}
            onClick={(event) => {
              if (!isVip) {
                event.preventDefault();
              }
            }}
            className={`relative rounded-[2rem] border p-6 transition-all ${
              isVip
                ? "bg-white border-slate-100 shadow-sm hover:shadow-md"
                : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            {!isVip && (
              <div className="absolute inset-0 rounded-[2rem] bg-white/35 backdrop-blur-[1px]" />
            )}
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-3">
                <BookOpen className={`w-8 h-8 ${isVip ? "text-[#27ae60]" : "text-slate-400"}`} />
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                    isVip
                      ? "bg-[#27ae60]/10 text-[#27ae60]"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isVip ? <Crown className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  {isVip ? "VIP" : "Locked"}
                </span>
              </div>
              <div className={`mt-5 font-black text-2xl ${isVip ? "text-[#1e2e51]" : "text-slate-500"}`}>
                Group Reviews
              </div>
              <div className={`mt-2 text-sm ${isVip ? "text-gray-500" : "text-slate-500"}`}>
                Retake multi-unit review packages created by admin, typically grouped by a short unit span.
              </div>
            </div>
          </Link>

          <Link
            to={isVip ? "/tests/semester" : "#"}
            onClick={(event) => {
              if (!isVip) {
                event.preventDefault();
              }
            }}
            className={`relative rounded-[2rem] border p-6 transition-all ${
              isVip
                ? "bg-white border-slate-100 shadow-sm hover:shadow-md"
                : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            {!isVip && (
              <div className="absolute inset-0 rounded-[2rem] bg-white/35 backdrop-blur-[1px]" />
            )}
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-3">
                <Trophy className={`w-8 h-8 ${isVip ? "text-[#f39c12]" : "text-slate-400"}`} />
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                    isVip
                      ? "bg-[#f39c12]/10 text-[#f39c12]"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isVip ? <Crown className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  {isVip ? "VIP" : "Locked"}
                </span>
              </div>
              <div className={`mt-5 font-black text-2xl ${isVip ? "text-[#1e2e51]" : "text-slate-500"}`}>
                Semester Tests
              </div>
              <div className={`mt-2 text-sm ${isVip ? "text-gray-500" : "text-slate-500"}`}>
                Open full mixed test packages built from question groups, single questions, and AI additions.
              </div>
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}
