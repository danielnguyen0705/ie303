import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  AlertTriangle,
  BookOpen,
  Brain,
  BrainCircuit,
  Coins,
  Clock3,
  Crown,
  Flame,
  GraduationCap,
  Loader2,
  Lock,
  RefreshCw,
  Minus,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import {
  getCurrentUser,
  getMyLearningAnalysis,
  refreshMyLearningAnalysis,
} from "@/api";
import { getAllGrades } from "@/api/admin";
import type { Grade } from "@/api/admin/types";
import type { AILearningAnalysis } from "@/api/types";
import { useLanguage } from "@/context/LanguageContext";

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

function buildStatsFromUser(user: UserProfile | null) {
  if (!user) {
    return emptyStats;
  }

  return {
    totalLessonsCompleted: 0,
    totalXP: user.exp,
    totalCoins: user.coin,
    currentStreak: user.streak,
    accuracy: 0,
  };
}

function clampProgress(value?: number | null) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value ?? 0)));
}

function formatAnalysisDate(value?: string | null) {
  if (!value) return "No snapshot yet";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getTrendMeta(trendLabel?: string | null) {
  switch (trendLabel) {
    case "IMPROVING":
      return {
        icon: TrendingUp,
        tone: "text-green-700 bg-green-50 border-green-200",
        label: "Improving",
      };
    case "DECLINING":
      return {
        icon: TrendingDown,
        tone: "text-red-700 bg-red-50 border-red-200",
        label: "Declining",
      };
    default:
      return {
        icon: Minus,
        tone: "text-slate-700 bg-slate-50 border-slate-200",
        label: trendLabel || "Stable",
      };
  }
}

function AIAssistantFigure() {
  return (
    <div className="relative mx-auto h-[220px] w-[220px] md:h-[250px] md:w-[250px]" aria-hidden="true">
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.24)_0%,rgba(255,255,255,0)_66%)] blur-2xl" />
      <div className="absolute left-1/2 top-4 h-12 w-[2px] -translate-x-1/2 bg-gradient-to-b from-white to-[#7dd3fc]" />
      <div className="absolute left-1/2 top-0 h-5 w-5 -translate-x-1/2 rounded-full border border-white/80 bg-[#f8fdff] shadow-[0_0_18px_rgba(125,211,252,0.55)]" />
      <div className="lesson-hex-shell absolute inset-x-7 top-9 h-[112px] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(221,243,255,0.96)_100%)] shadow-[0_24px_50px_rgba(21,92,165,0.16)]">
        <div className="absolute inset-x-4 top-4 h-8 rounded-full bg-[#112847]">
          <div className="flex h-full items-center justify-center gap-4">
            <span className="h-2.5 w-7 rounded-full bg-[#67e8f9] shadow-[0_0_16px_rgba(103,232,249,0.7)]" />
            <span className="h-2.5 w-7 rounded-full bg-[#67e8f9] shadow-[0_0_16px_rgba(103,232,249,0.7)]" />
          </div>
        </div>
        <div className="absolute inset-x-8 bottom-6 h-10 rounded-[1.15rem] border border-[#c7e7fb] bg-[linear-gradient(180deg,#ffffff_0%,#e8f6ff_100%)]">
          <div className="grid h-full grid-cols-4 place-items-center">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7dd3fc]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#38bdf8]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#0ea5e9]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#38bdf8]" />
          </div>
        </div>
      </div>
      <div className="absolute left-7 top-[95px] h-16 w-4 rounded-full bg-[linear-gradient(180deg,#f7fdff_0%,#c7ebff_100%)] shadow-[0_10px_20px_rgba(21,92,165,0.12)]" />
      <div className="absolute right-7 top-[95px] h-16 w-4 rounded-full bg-[linear-gradient(180deg,#f7fdff_0%,#c7ebff_100%)] shadow-[0_10px_20px_rgba(21,92,165,0.12)]" />
      <div className="absolute left-[58px] top-[152px] h-14 w-4 rotate-[18deg] rounded-full bg-[linear-gradient(180deg,#f7fdff_0%,#c7ebff_100%)] shadow-[0_10px_20px_rgba(21,92,165,0.12)]" />
      <div className="absolute right-[58px] top-[152px] h-14 w-4 -rotate-[18deg] rounded-full bg-[linear-gradient(180deg,#f7fdff_0%,#c7ebff_100%)] shadow-[0_10px_20px_rgba(21,92,165,0.12)]" />
      <div className="absolute left-[72px] bottom-8 h-12 w-4 rounded-full bg-[linear-gradient(180deg,#f7fdff_0%,#c7ebff_100%)] shadow-[0_10px_20px_rgba(21,92,165,0.12)]" />
      <div className="absolute right-[72px] bottom-8 h-12 w-4 rounded-full bg-[linear-gradient(180deg,#f7fdff_0%,#c7ebff_100%)] shadow-[0_10px_20px_rgba(21,92,165,0.12)]" />
      <div className="absolute left-[58px] bottom-1 h-4 w-10 rounded-full border border-white/75 bg-white/90" />
      <div className="absolute right-[58px] bottom-1 h-4 w-10 rounded-full border border-white/75 bg-white/90" />
      <div className="absolute right-2 top-10 rounded-full border border-white/75 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#155ca5] shadow-sm">
        AI
      </div>
      <div className="absolute left-0 top-14 rounded-full border border-[#cce9ff] bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#0f4c88] shadow-sm">
        Smart
      </div>
    </div>
  );
}

export function Dashboard() {
  const { copy } = useLanguage();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState(emptyStats);
  const [analysis, setAnalysis] = useState<AILearningAnalysis | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [refreshingInsights, setRefreshingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadDashboardData();
  }, []);

  useEffect(() => {
    const loadInsights = async () => {
      if (!user?.isVip) {
        setAnalysis(null);
        setLoadingInsights(false);
        return;
      }

      setLoadingInsights(true);
      const response = await getMyLearningAnalysis();

      if (response.success) {
        setAnalysis(response.data ?? null);
        setInsightsError(null);
      } else {
        setAnalysis(null);
        setInsightsError(response.error?.message || "Could not load ML insights.");
      }

      setLoadingInsights(false);
    };

    void loadInsights();
  }, [user?.isVip]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [gradesResponse, userResponse] = await Promise.all([
        getAllGrades(),
        getCurrentUser(),
      ]);

      if (gradesResponse.success && userResponse.success) {
        const nextUser = (userResponse.data ?? null) as UserProfile | null;
        setGrades(gradesResponse.data ?? []);
        setUser(nextUser);
        setStats(buildStatsFromUser(nextUser));
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

  const handleRefreshInsights = async () => {
    if (!isVip || refreshingInsights) return;

    setRefreshingInsights(true);
    setInsightsError(null);

    const response = await refreshMyLearningAnalysis();
    if (response.success) {
      setAnalysis(response.data ?? null);
      if (!response.data) {
        setInsightsError(copy("No ML snapshot was generated yet.", "Chưa tạo được snapshot ML."));
      }
    } else {
      setInsightsError(response.error?.message || copy("Could not refresh ML insights.", "Không thể làm mới phân tích ML."));
    }

    setRefreshingInsights(false);
  };

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-4 py-10 md:px-6">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#155ca5]" />
          <p className="font-medium text-gray-600">
            {copy("Loading dashboard...", "Đang tải bảng điều khiển...")}
          </p>
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
            {copy("Retry", "Thử lại")}
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
  const latestTrendMeta = getTrendMeta(analysis?.trendLabel);
  const LatestTrendIcon = latestTrendMeta.icon;

  const quickStats = [
    {
      label: copy("Streak", "Chuỗi ngày học"),
      value: `${stats.currentStreak}`,
      hint: copy("days in a row", "ngày liên tiếp"),
      icon: Flame,
      accent: "text-[#f39c12]",
      bg: "bg-[#fff4e5]",
    },
    {
      label: copy("Accuracy", "Độ chính xác"),
      value: `${stats.accuracy}%`,
      hint: copy("correctness", "mức chính xác"),
      icon: Target,
      accent: "text-[#1f8b4d]",
      bg: "bg-[#edf9f1]",
    },
    {
      label: "EXP",
      value: stats.totalXP.toLocaleString(),
      hint: copy("experience", "kinh nghiệm"),
      icon: Zap,
      accent: "text-[#155ca5]",
      bg: "bg-[#eef6ff]",
    },
    {
      label: copy("Coins", "Điểm thưởng"),
      value: stats.totalCoins.toLocaleString(),
      hint: copy("reward points", "điểm thưởng"),
      icon: Coins,
      accent: "text-[#b7791f]",
      bg: "bg-[#fff7df]",
    },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-5 pb-20 md:px-6 md:py-6 md:pb-12">
      <section className="learner-tech-panel rounded-[2rem] p-5 md:p-7">
        <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.2fr)_300px]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#155ca5]">
              {copy("Momentum", "Nhịp học")}
            </p>
            <h1 className="mt-1 text-2xl font-black text-[#1e2e51]">
              {copy("Your learning rhythm today", "Nhịp học hôm nay")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#4a617d] md:text-base">
              {copy(
                "A cleaner dashboard for tracking progress, ML insights, and a more technology-forward study experience.",
                "Dashboard gọn hơn để theo dõi tiến độ, xem insight ML và tạo cảm giác công nghệ rõ hơn khi học.",
              )}
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#4b6f97]">
              <span className="lesson-tech-badge rounded-full border border-white/70 px-4 py-2">
                AI assisted
              </span>
              <span className="lesson-tech-badge rounded-full border border-white/70 px-4 py-2">
                Progress analytics
              </span>
              <span className="lesson-tech-badge rounded-full border border-white/70 px-4 py-2">
                Adaptive learning
              </span>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <AIAssistantFigure />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div />
          <span
            className={`inline-flex shrink-0 max-w-full items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.18em] ${
              isVip
                ? "bg-[#fed023] text-[#5d4700]"
                : "bg-[#eef2f7] text-[#42526d]"
            }`}
          >
            <Crown className="h-3.5 w-3.5" />
            {isVip ? copy("VIP Active", "VIP đang hoạt động") : copy("Free Plan", "Gói miễn phí")}
          </span>
        </div>

        <div className="mt-5 grid w-full min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
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

      <section id="ml-insights" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#155ca5]">
              {copy("ML Insights", "Phân tích ML")}
            </p>
            <h2 className="mt-1 text-2xl font-black text-[#1e2e51]">
              {copy("Learning signals from your study history", "Tín hiệu học tập từ lịch sử học")}
            </h2>
          </div>

          {isVip && analysis && (
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600">
              <Clock3 className="h-4 w-4" />
              {formatAnalysisDate(analysis.generatedAt)}
            </div>
          )}
          {isVip && (
            <button
              type="button"
              onClick={handleRefreshInsights}
              disabled={refreshingInsights}
              className="inline-flex items-center gap-2 rounded-full border border-[#bfd8ff] bg-white px-4 py-2 text-sm font-black text-[#155ca5] transition hover:bg-[#eef6ff] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${refreshingInsights ? "animate-spin" : ""}`} />
              {copy("Refresh ML", "Làm mới ML")}
            </button>
          )}
        </div>

        {isVip && insightsError && (
          <div className="rounded-[1.35rem] border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {insightsError}
          </div>
        )}

        {!isVip ? (
          <div className="rounded-[1.35rem] border border-[#f5d39b] bg-[#fff8eb] p-6">
            <div className="flex items-start gap-3">
              <Lock className="mt-1 h-5 w-5 text-[#d29b2a]" />
              <div>
                <div className="font-black text-[#8d5c06]">
                  {copy("VIP only", "Chỉ dành cho VIP")}
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8d5c06]">
                  {copy(
                    "Upgrade to VIP to see ML-based learning insights on your dashboard.",
                    "Nâng cấp VIP để xem phân tích ML trên dashboard của bạn.",
                  )}
                </p>
              </div>
            </div>
          </div>
        ) : loadingInsights ? (
          <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-10 text-center text-slate-500">
            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
            <div className="mt-3">{copy("Loading ML insights...", "Đang tải phân tích ML...")}</div>
          </div>
        ) : analysis ? (
          <div className="space-y-4 rounded-[1.35rem] border border-slate-100 bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-green-200 bg-green-50 p-5">
                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-green-700">
                  <BrainCircuit className="h-4 w-4" />
                  {copy("Strongest Skill", "Điểm mạnh nhất")}
                </div>
                <div className="mt-3 text-2xl font-black text-green-900">
                  {analysis.strongSkill || copy("Not enough data", "Chưa đủ dữ liệu")}
                </div>
              </div>

              <div className="rounded-3xl border border-red-200 bg-red-50 p-5">
                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  {copy("Needs Improvement", "Cần cải thiện")}
                </div>
                <div className="mt-3 text-2xl font-black text-red-900">
                  {analysis.weakSkill || copy("Not enough data", "Chưa đủ dữ liệu")}
                </div>
                {analysis.weakTopic && (
                  <div className="mt-2 text-sm text-red-700">
                    {copy("Weak topic", "Mảng yếu")}:{" "}
                    <span className="font-bold">{analysis.weakTopic}</span>
                  </div>
                )}
              </div>

              <div className={`rounded-3xl border p-5 ${latestTrendMeta.tone}`}>
                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em]">
                  <LatestTrendIcon className="h-4 w-4" />
                  {copy("Learning Trend", "Xu hướng học")}
                </div>
                <div className="mt-3 text-2xl font-black">{latestTrendMeta.label}</div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#dbeafe] bg-[#f8fbff] p-5">
              <div className="text-sm font-black uppercase tracking-[0.18em] text-[#155ca5]">
                {copy("Recommendation", "Gợi ý")}
              </div>
              <p className="mt-3 text-sm leading-7 text-[#1e2e51]">
                {analysis.recommendation ||
                  copy("No recommendation available yet.", "Chưa có gợi ý nào lúc này.")}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            {copy(
              "No ML snapshot yet. Complete a few lessons and check back later.",
              "Chưa có snapshot ML. Bạn học thêm vài bài rồi quay lại xem sau nhé.",
            )}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#155ca5]">
            {copy("Learning Path", "Lộ trình học")}
          </p>
          <h2 className="mt-1 text-2xl font-black text-[#1e2e51]">
            {copy("Choose a grade to start learning", "Chọn lớp để vào học")}
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
                  <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${style.soft}`}>
                    {grade.name}
                  </span>
                </div>

                <div className="mt-3 min-w-0 flex-1 sm:mt-4">
                  <div className="truncate text-base font-black text-[#1e2e51] sm:text-lg">
                    {grade.name}
                  </div>
                  <div className="mt-1 line-clamp-2 text-[13px] leading-5 text-gray-500 sm:text-sm sm:leading-6">
                    {progress > 0
                      ? copy(
                          "Continue with the next units in your path.",
                          "Vào tiếp để học các unit tiếp theo.",
                        )
                      : copy(
                          "Open the learning path by unit and section.",
                          "Mở lộ trình học theo unit và section.",
                        )}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm font-bold text-[#1e2e51]">
                    <span>{copy("Progress", "Tiến độ")}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 sm:h-2">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${style.accent}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#155ca5]">
                  {copy("Open unit list", "Vào danh sách unit")}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#155ca5]">
            {copy("AI Practice", "Luyện tập AI")}
          </p>
          <h2 className="mt-1 text-2xl font-black text-[#1e2e51]">
            {copy("Extra practice tools", "Công cụ luyện thêm")}
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
                {!isVip && <Lock className="h-3 w-3" />}
                {isVip ? "VIP" : copy("Locked", "Bị khóa")}
              </span>
            </div>
            <div className="mt-4 text-lg font-black text-[#1e2e51]">AI Questions</div>
            <div className="mt-1 text-sm leading-6 text-gray-500">
              {copy(
                "Generate a focused extra practice set in seconds.",
                "Sinh nhanh bộ câu hỏi luyện thêm theo mục tiêu.",
              )}
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}
