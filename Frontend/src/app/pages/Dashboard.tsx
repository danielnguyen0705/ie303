import { useState, useEffect } from 'react';
import { Link } from "react-router";
import { ProgressBar } from "../components/ProgressBar";
import { Flame, Coins, Zap, Target, Lock, Loader2 } from "lucide-react";
import { getAllUnits, getUserStats, getCurrentUser } from '@/api';
import type { Unit, User } from '@/data/mockData';

export function Dashboard() {
  const [units, setUnits] = useState<Unit[]>([]);
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

      // Load data in parallel
      const [unitsResponse, userResponse, statsResponse] = await Promise.all([
        getAllUnits(),
        getCurrentUser(),
        getUserStats(),
      ]);

      if (unitsResponse.success && userResponse.success && statsResponse.success) {
        // Take first 4 units for dashboard display
        setUnits(unitsResponse.data.slice(0, 4));
        setUser(userResponse.data);
        setStats(statsResponse.data);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('An error occurred while loading data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate overall progress
  const overallProgress = units.length > 0
    ? Math.round(units.reduce((sum, unit) => sum + unit.progress, 0) / units.length)
    : 0;

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
      {/* Welcome Section */}
      <section className="space-y-6">
        <div>
          <h1 className="text-5xl font-black text-[#155ca5] tracking-tight mb-2">
            Xin chào, {user?.name || 'Bạn'}!
          </h1>
          <p className="text-xl text-gray-600 font-medium">
            Bạn đang thực hiện rất tốt lộ trình học tập của mình.
          </p>
        </div>

        {/* Current Course Card */}
        <div className="bg-white p-8 rounded-lg shadow-sm relative overflow-hidden group transition-all hover:shadow-lg">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#155ca5]/5 rounded-full blur-3xl group-hover:bg-[#155ca5]/10 transition-colors" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3">
                <span className="bg-[#73aaf9]/20 text-[#155ca5] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  Current Course
                </span>
                <h2 className="text-2xl font-black">Global Success 11</h2>
              </div>
              <ProgressBar value={overallProgress} label="Overall Progress" />
            </div>
            <Link
              to="/unit/1"
              className="bg-gradient-to-r from-[#155ca5] to-[#005095] text-white px-8 py-4 rounded-md font-bold shadow-md hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              Tiếp tục bài học
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Gamification Stats */}
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

      {/* Unit Cards */}
      <section className="space-y-8">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-3xl font-black">Course Content</h3>
            <p className="text-gray-600 font-medium">
              Track your progress through each unit of the curriculum.
            </p>
          </div>
          <Link
            to="/units"
            className="text-[#155ca5] font-bold hover:underline"
          >
            View all units →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {units.map((unit) => (
            <div
              key={unit.id}
              className={`rounded-lg overflow-hidden shadow-lg transition-all duration-300 ${
                unit.status !== 'locked'
                  ? "hover:shadow-2xl transform hover:-translate-y-2 cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              {/* Unit Image/Header */}
              <div className="h-40 relative bg-gradient-to-br from-[#155ca5] to-[#005095]">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  {unit.status === 'in-progress' ? (
                    <span className="bg-[#75f39c]/90 text-[#00592b] text-[10px] font-black uppercase px-2 py-1 rounded-full">
                      In Progress
                    </span>
                  ) : unit.status === 'completed' ? (
                    <span className="bg-[#27ae60]/90 text-white text-[10px] font-black uppercase px-2 py-1 rounded-full">
                      Completed
                    </span>
                  ) : (
                    <Lock className="w-6 h-6 text-white" />
                  )}
                </div>
              </div>

              {/* Unit Content */}
              <div className="p-6 space-y-4 bg-white">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-500">
                    UNIT {String(unit.id).padStart(2, "0")}
                  </span>
                  <h4 className="text-xl font-extrabold">{unit.title}</h4>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-gray-500">
                    <span>Completion</span>
                    <span>{unit.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        unit.status !== 'locked' ? "bg-[#27ae60]" : "bg-gray-300"
                      }`}
                      style={{ width: `${unit.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-bold text-gray-500">
                    <span>{unit.completedLessons}/{unit.totalLessons} lessons</span>
                  </div>
                </div>

                {unit.status !== 'locked' ? (
                  <Link
                    to={`/unit/${unit.id}`}
                    className="w-full py-3 rounded-md bg-gray-100 text-[#155ca5] font-bold text-center block hover:bg-[#155ca5] hover:text-white transition-colors"
                  >
                    {unit.status === 'completed' ? 'Review Unit' : 'Continue Unit'}
                  </Link>
                ) : (
                  <div className="w-full py-3 rounded-md bg-gray-100 text-center text-gray-500 font-bold">
                    Locked
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Learning Tips & Leaderboard */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#1e2e51] text-white rounded-lg p-10 relative overflow-hidden">
          <div className="relative z-10 space-y-6 max-w-lg">
            <h3 className="text-3xl font-black leading-tight">
              Mẹo học từ vựng hiệu quả hôm nay
            </h3>
            <p className="text-lg opacity-90">
              Hãy thử phương pháp <b>Spaced Repetition</b>. Ôn lại những từ khó
              Unit 1 sau 10 phút, 1 giờ và 1 ngày để ghi nhớ vĩnh viễn.
            </p>
            <button className="bg-white text-[#1e2e51] px-6 py-3 rounded-md font-bold hover:bg-gray-100 transition-colors">
              Thử ngay
            </button>
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
                  Bạn ({user?.name || 'User'})
                </span>
                <span className="text-xs font-bold text-[#155ca5]">{stats.totalXP} XP</span>
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
