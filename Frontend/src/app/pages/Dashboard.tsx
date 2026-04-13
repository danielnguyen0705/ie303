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
} from "lucide-react";
import { getUserStats, getCurrentUser, getAllGrades } from "@/api";
import type { User } from "@/data/mockData";
import type { Grade } from "@/api/content";

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

export function Dashboard() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    totalLessonsCompleted: 0,
    totalXP: 0,
    totalCoins: 0,
    currentStreak: 0,
    accuracy: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
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
        setUser(userResponse.data ?? null);
        setStats(
          statsResponse.data ?? {
            totalLessonsCompleted: 0,
            totalXP: 0,
            totalCoins: 0,
            currentStreak: 0,
            accuracy: 0,
          },
        );
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
          <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
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
            Thử lại
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 space-y-12 pb-24 md:pb-12">
      <section className="space-y-6">
        <div>
          <h1 className="text-5xl font-black text-[#155ca5] tracking-tight mb-2">
            Xin chào, {user?.name || "Bạn"}!
          </h1>
          <p className="text-xl text-gray-600 font-medium">
            Hãy chọn khối lớp để bắt đầu hành trình học tập của mình.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#155ca5]/5 rounded-full blur-3xl" />

          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-3">
              <span className="bg-[#73aaf9]/20 text-[#155ca5] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Choose Your Grade
              </span>
              <h2 className="text-2xl font-black text-[#1e2e51]">
                Select Grade
              </h2>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-max flex items-start gap-8 px-2 py-4">
                {grades.map((grade, index) => {
                  const style = gradeStyles[index % gradeStyles.length];
                  const Icon = style.icon;

                  return (
                    <Link
                      key={grade.id}
                      to={`/grades/${grade.id}/units`}
                      className="group flex flex-col items-center text-center w-[150px] shrink-0"
                    >
                      <div
                        className={`w-24 h-24 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-1 ${style.circle}`}
                      >
                        <Icon className="w-10 h-10" />
                      </div>

                      <div className="mt-4 space-y-2">
                        <div
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${style.badge}`}
                        >
                          Grade {grade.gradeNumber ?? grade.id}
                        </div>

                        <h3 className="text-lg font-black text-[#1e2e51] leading-tight">
                          {grade.title}
                        </h3>

                        {grade.description && (
                          <p className="text-sm text-gray-500 leading-snug">
                            {grade.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm hover:scale-[1.02] transition-transform">
          <Coins className="w-8 h-8 text-[#f1c40f] mb-3" fill="#f1c40f" />
          <div className="text-2xl font-black">{stats.totalCoins.toLocaleString()}</div>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Coins Earned
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm hover:scale-[1.02] transition-transform">
          <Zap className="w-8 h-8 text-[#155ca5] mb-3" fill="#155ca5" />
          <div className="text-2xl font-black">{stats.totalXP.toLocaleString()}</div>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Total XP
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm hover:scale-[1.02] transition-transform">
          <Flame className="w-8 h-8 text-[#f39c12] mb-3" fill="#f39c12" />
          <div className="text-2xl font-black">{stats.currentStreak} Days</div>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Current Streak
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm hover:scale-[1.02] transition-transform">
          <Target className="w-8 h-8 text-[#27ae60] mb-3" />
          <div className="text-2xl font-black">{stats.accuracy}%</div>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Accuracy
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#1e2e51] text-white rounded-lg p-10 relative overflow-hidden">
          <div className="relative z-10 space-y-6 max-w-lg">
            <h3 className="text-3xl font-black leading-tight">
              Bắt đầu từ khối lớp phù hợp
            </h3>
            <p className="text-lg opacity-90">
              Chọn khối lớp trước, sau đó hệ thống sẽ dẫn bạn qua Unit, Section
              và Lesson theo đúng lộ trình học.
            </p>
            <Link
              to="/grades"
              className="inline-block bg-white text-[#1e2e51] px-6 py-3 rounded-md font-bold hover:bg-gray-100 transition-colors"
            >
              Xem tất cả khối lớp
            </Link>
          </div>
          <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-[#155ca5]/20 to-transparent" />
        </div>

        <div className="bg-white rounded-lg p-8 flex flex-col justify-between">
          <div>
            <h4 className="text-xl font-black mb-2">Bảng xếp hạng</h4>
            <p className="text-sm text-gray-600 mb-6">
              Bạn đang đứng thứ <b>#{user?.level || 12}</b> trong giải đấu Sapphire.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#fed023] flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-200" />
                <span className="font-bold flex-1">Elena P.</span>
                <span className="text-xs font-bold">2,450 XP</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-200" />
                <span className="font-bold flex-1">Alex Wong</span>
                <span className="text-xs font-bold">2,100 XP</span>
              </div>

              <div className="flex items-center gap-3 bg-[#155ca5]/10 p-2 -mx-2 rounded-md">
                <div className="w-8 h-8 rounded-full bg-[#155ca5] text-white flex items-center justify-center font-bold text-xs">
                  {user?.level || 12}
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-200 ring-2 ring-[#155ca5]" />
                <span className="font-black flex-1 text-[#155ca5]">
                  Bạn ({user?.name || "User"})
                </span>
                <span className="text-xs font-bold text-[#155ca5]">
                  {stats.totalXP} XP
                </span>
              </div>
            </div>
          </div>

          <Link
            to="/leaderboard"
            className="mt-6 w-full border-2 border-[#155ca5]/20 text-[#155ca5] py-2 rounded-md font-bold hover:bg-[#155ca5]/5 transition-colors text-center"
          >
            Xem chi tiết
          </Link>
        </div>
      </section>
    </main>
  );
}