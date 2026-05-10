import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Coins,
  Crown,
  Flame,
  GraduationCap,
  Loader2,
  Lock,
  Star,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { getCurrentUser, getUserStats } from "@/api";
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
    accent: "from-[#155ca5] to-[#0f4c88]",
    soft: "bg-[#eef6ff] text-[#155ca5]",
    border: "border-[#bfd8ff]",
  },
  {
    icon: BookOpen,
    accent: "from-[#27ae60] to-[#1f8b4d]",
    soft: "bg-[#ecfbf2] text-[#27ae60]",
    border: "border-[#b7e8c7]",
  },
  {
    icon: Trophy,
    accent: "from-[#f39c12] to-[#d68910]",
    soft: "bg-[#fff5e7] text-[#f39c12]",
    border: "border-[#f5d39b]",
  },
  {
    icon: Star,
    accent: "from-[#d35454] to-[#b23b3b]",
    soft: "bg-[#fff0f0] text-[#d35454]",
    border: "border-[#f0c3c3]",
  },
];

const emptyStats = {
  totalLessonsCompleted: 0,
  totalXP: 0,
  totalCoins: 0,
  currentStreak: 0,
  accuracy: 0,
};

function clampProgress(value?: number | null) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value ?? 0)));
}

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

      if (gradesResponse.success && userResponse.success) {
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
      <main className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-4 py-10 md:px-6">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#155ca5]" />
          <p className="font-medium text-gray-600">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-bold text-red-600">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-4 rounded-xl bg-red-600 px-6 py-2 text-white transition-colors hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  const isVip = Boolean(user?.isVip);
  const currentStudyGrade =
    [...(user?.studyingGrades ?? [])].sort(
      (left, right) => right.progressPercent - left.progressPercent,
    )[0] ?? null;
  const highlightedGradeId =
    currentStudyGrade?.gradeId ?? grades[0]?.id ?? null;

  const quickStats = [
    {
      label: "Streak",
      value: `${stats.currentStreak}`,
      hint: "ngày liên tiếp",
      icon: Flame,
      accent: "text-[#f39c12]",
      bg: "bg-[#fff4e5]",
    },
    {
      label: "Accuracy",
      value: `${stats.accuracy}%`,
      hint: "độ chính xác",
      icon: Target,
      accent: "text-[#1f8b4d]",
      bg: "bg-[#edf9f1]",
    },
    {
      label: "EXP",
      value: stats.totalXP.toLocaleString(),
      hint: "kinh nghiệm",
      icon: Zap,
      accent: "text-[#155ca5]",
      bg: "bg-[#eef6ff]",
    },
    {
      label: "Coins",
      value: stats.totalCoins.toLocaleString(),
      hint: "điểm thưởng",
      icon: Coins,
      accent: "text-[#b7791f]",
      bg: "bg-[#fff7df]",
    },
  ];

  return (
    // THÊM overflow-x-hidden ĐỂ TRỊ DỨT ĐIỂM LỖI RENDER PIXEL CỦA ANDROID
    <main className="mx-auto w-full max-w-7xl overflow-x-hidden space-y-6 sm:space-y-8 px-4 py-5 pb-20 sm:px-6 sm:py-8 sm:pb-12">
      {/* --- SECTION 1: STATS --- */}
      <section className="flex w-full min-w-0 flex-col gap-4">
        <div className="flex w-full min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] font-black uppercase tracking-wider text-[#155ca5] sm:text-xs sm:tracking-[0.2em]">
              Momentum
            </p>
            <h1 className="mt-1 truncate text-xl font-black text-[#1e2e51] sm:text-2xl">
              Nhịp học hôm nay
            </h1>
          </div>

          <span
            className={`inline-flex shrink-0 max-w-full items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.18em] ${
              isVip
                ? "bg-[#fed023] text-[#5d4700]"
                : "bg-[#eef2f7] text-[#42526d]"
            }`}
          >
            <Crown className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {isVip ? "VIP Active" : "Free Plan"}
            </span>
          </span>
        </div>

        <div className="grid w-full min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
          {quickStats.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex w-full min-w-0 items-center gap-2.5 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:gap-3 sm:p-4"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 sm:rounded-2xl ${item.bg}`}
                >
                  <Icon
                    className={`h-4.5 w-4.5 sm:h-5 sm:w-5 ${item.accent}`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[9px] font-black uppercase tracking-wider text-gray-400 sm:text-[11px] sm:tracking-[0.18em]">
                    {item.label}
                  </div>
                  <div className="truncate text-[15px] font-black text-[#1e2e51] sm:text-lg">
                    {item.value}
                  </div>
                  <div className="truncate text-[9px] text-gray-500 sm:text-xs">
                    {item.hint}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* --- SECTION 2: LEARNING PATH --- */}
      <section className="flex w-full min-w-0 flex-col gap-4">
        <div className="min-w-0 w-full">
          <p className="truncate text-[10px] font-black uppercase tracking-wider text-[#155ca5] sm:text-xs sm:tracking-[0.2em]">
            Learning Path
          </p>
          <h2 className="mt-1 truncate text-xl font-black text-[#1e2e51] sm:text-2xl">
            Chọn lớp để vào học
          </h2>
        </div>

        <div className="grid w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {grades.map((grade, index) => {
            const style = gradeStyles[index % gradeStyles.length];
            const Icon = style.icon;
            const studyingGrade = user?.studyingGrades?.find(
              (item) => item.gradeId === grade.id,
            );
            const progress = clampProgress(studyingGrade?.progressPercent);
            const isHighlighted = highlightedGradeId === grade.id;

            return (
              <Link
                key={grade.id}
                to={`/grades/${grade.id}/units`}
                className={`group flex w-full min-w-0 flex-col rounded-[1.35rem] border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  isHighlighted
                    ? `${style.border} ring-2 ring-[#155ca5]/10`
                    : "border-slate-100"
                }`}
              >
                <div className="flex w-full min-w-0 items-start justify-between gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${style.accent} text-white shadow-sm sm:h-12 sm:w-12 sm:rounded-2xl`}
                  >
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  {/* FIX: Thay shrink-0 truncate bằng shrink-0 whitespace-nowrap để không xung đột */}
                  <span
                    className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider sm:px-3 sm:text-[11px] sm:tracking-[0.18em] ${style.soft}`}
                  >
                    Grade {grade.id}
                  </span>
                </div>

                <div className="mt-3 min-w-0 flex-1 sm:mt-4">
                  <div className="truncate text-base font-black text-[#1e2e51] sm:text-lg">
                    {grade.name}
                  </div>
                  <div className="mt-1 line-clamp-2 text-[13px] leading-5 text-gray-500 sm:text-sm sm:leading-6">
                    {progress > 0
                      ? "Vào tiếp để học các unit tiếp theo."
                      : "Mở lộ trình học theo unit và section."}
                  </div>
                </div>

                <div className="mt-4 w-full space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#1e2e51] sm:text-sm">
                    <span>Tiến độ</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 sm:h-2">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${style.accent}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-black text-[#155ca5] sm:gap-2 sm:text-sm">
                  Vào danh sách unit
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 transition group-hover:translate-x-1 sm:h-4 sm:w-4" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* --- SECTION 3: AI PRACTICE --- */}
      <section className="flex w-full min-w-0 flex-col gap-4">
        <div className="min-w-0 w-full">
          <p className="truncate text-[10px] font-black uppercase tracking-wider text-[#155ca5] sm:text-xs sm:tracking-[0.2em]">
            AI Practice
          </p>
          <h2 className="mt-1 truncate text-xl font-black text-[#1e2e51] sm:text-2xl">
            Công cụ luyện thêm
          </h2>
        </div>

        <div className="grid w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Link
            to={isVip ? "/ai/personalized-questions" : "/topup"}
            className={`flex w-full min-w-0 flex-col rounded-[1.35rem] border p-4 shadow-sm transition hover:shadow-md ${
              isVip
                ? "border-slate-100 bg-white"
                : "border-[#f5d39b] bg-[#fff8eb]"
            }`}
          >
            <div className="flex w-full min-w-0 items-center justify-between gap-3">
              <Brain
                className={`h-6 w-6 shrink-0 sm:h-7 sm:w-7 ${isVip ? "text-[#155ca5]" : "text-[#d29b2a]"}`}
              />
              <span
                className={`inline-flex shrink-0 max-w-[60%] items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider sm:px-3 sm:text-[11px] sm:tracking-[0.18em] ${
                  isVip
                    ? "bg-[#155ca5]/10 text-[#155ca5]"
                    : "bg-[#f7e3b7] text-[#8d5c06]"
                }`}
              >
                {!isVip && (
                  <Lock className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3" />
                )}
                <span className="truncate">{isVip ? "VIP" : "Locked"}</span>
              </span>
            </div>
            <div className="mt-3 min-w-0 w-full sm:mt-4">
              <div className="truncate text-base font-black text-[#1e2e51] sm:text-lg">
                AI Questions
              </div>
              <div className="mt-1 line-clamp-2 text-[13px] leading-5 text-gray-500 sm:text-sm sm:leading-6">
                Sinh nhanh bộ câu hỏi luyện thêm theo mục tiêu.
              </div>
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}
