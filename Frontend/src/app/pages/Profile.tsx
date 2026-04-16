import { useState, useEffect } from "react";
import {
  Settings,
  LogOut,
  Flame,
  Coins,
  Zap,
  Target,
  Trophy,
  Calendar,
  Loader2,
  BookOpen,
  Award,
  KeyRound,
} from "lucide-react";
import { getUserProfile, getUserStats, getUserHistory } from "@/api";
import { changePassword as changePasswordApi } from "@/api/auth";
import { useAuth } from "@/context/AuthContext";
import type { User } from "@/data/mockData";

type UserStats = {
  totalLessonsCompleted: number;
  totalTestsTaken: number;
  averageScore: number;
  totalXP: number;
  totalCoins: number;
  currentStreak: number;
  longestStreak: number;
  accuracy: number;
};

type HistoryItem = {
  id: string;
  type: "lesson" | "test" | "exercise";
  title: string;
  completedAt: string;
  score: number;
  xpGained: number;
};

const initialStats: UserStats = {
  totalLessonsCompleted: 0,
  totalTestsTaken: 0,
  averageScore: 0,
  totalXP: 0,
  totalCoins: 0,
  currentStreak: 0,
  longestStreak: 0,
  accuracy: 0,
};

export function Profile() {
  const { logout, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats>(initialStats);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    loadProfileData();
  }, []);

  useEffect(() => {
    if (!isPasswordModalOpen || !passwordSuccess) {
      return;
    }

    const timer = window.setTimeout(() => {
      closePasswordModal();
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [isPasswordModalOpen, passwordSuccess]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [userResponse, statsResponse, historyResponse] = await Promise.all([
        getUserProfile(),
        getUserStats(),
        getUserHistory(5),
      ]);

      if (userResponse.success && userResponse.data) {
        setUser(userResponse.data);
      }

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      if (historyResponse.success && historyResponse.data) {
        setHistory(historyResponse.data);
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const getVIPBadge = (vipStatus: string) => {
    if (vipStatus === "premium")
      return { label: "Premium Member", color: "bg-purple-600" };
    if (vipStatus === "elite")
      return { label: "Elite Member", color: "bg-amber-600" };
    return null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("Vui long nhap day du thong tin mat khau.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Mat khau moi phai co it nhat 6 ky tu.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Mat khau xac nhan khong khop.");
      return;
    }

    try {
      setChangingPassword(true);
      const response = await changePasswordApi(oldPassword, newPassword);

      if (!response.success) {
        setPasswordError(response.error?.message || "Change password failed.");
        return;
      }

      setPasswordSuccess("Password changed successfully.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Error changing password:", err);
      setPasswordError("Change password failed. Please try again.");
    } finally {
      setChangingPassword(false);
    }
  };

  const openPasswordModal = () => {
    setPasswordError(null);
    setPasswordSuccess(null);
    setIsPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    if (changingPassword) {
      return;
    }

    setIsPasswordModalOpen(false);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
    setPasswordSuccess(null);
  };

  const handleLogout = async (): Promise<void> => {
    setLogoutError(null);
    const isSuccess = await logout();

    if (!isSuccess) {
      setLogoutError("Unable to logout right now. Please try again.");
    }
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-10 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#155ca5] animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">Loading profile...</p>
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
            onClick={loadProfileData}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-md font-bold hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  if (!user) return null;

  const vipBadge = getVIPBadge(user.vipStatus);

  return (
    <main className="pt-12 px-4 md:px-8 max-w-7xl mx-auto space-y-8 pb-24 md:pb-12">
      {/* Header Profile Card */}
      <section className="relative">
        <div className="bg-white rounded-lg p-8 md:p-12 shadow-sm flex flex-col md:flex-row items-center gap-8 overflow-hidden">
          {/* Decorative element */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#73aaf9]/20 rounded-full blur-3xl" />
          <div className="relative group">
            <div className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-[#155ca5]/10 p-1 bg-white">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            {vipBadge && (
              <div
                className={`absolute bottom-2 right-2 ${vipBadge.color} text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1`}
              >
                <span>⭐</span>
                {vipBadge.label}
              </div>
            )}
          </div>
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-1">
                {user.name}
              </h1>
              <p className="font-mono text-[#155ca5] font-bold uppercase tracking-widest text-sm">
                Level {user.level} - Master Scholar
              </p>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="flex items-center gap-2 bg-yellow-50 px-6 py-3 rounded-full hover:scale-105 transition-transform cursor-pointer">
                <Coins className="w-5 h-5 text-[#f1c40f]" fill="#f1c40f" />
                <span className="font-mono font-bold">
                  {stats.totalCoins.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 px-6 py-3 rounded-full hover:scale-105 transition-transform cursor-pointer">
                <Zap className="w-5 h-5 text-[#155ca5]" />
                <span className="font-mono font-bold">
                  {stats.totalXP.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-orange-50 px-6 py-3 rounded-full hover:scale-105 transition-transform cursor-pointer">
                <Flame className="w-5 h-5 text-[#f39c12]" fill="#f39c12" />
                <span className="font-mono font-bold">
                  {stats.currentStreak}-day Streak
                </span>
              </div>
            </div>
          </div>
          <div className="w-full md:w-auto flex flex-col gap-3">
            <button className="bg-[#155ca5] text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg shadow-[#155ca5]/20 hover:scale-105 active:scale-95 transition-all">
              Edit Profile
            </button>
            <button className="bg-gray-100 text-gray-700 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-200 transition-colors">
              <Settings className="w-5 h-5 inline mr-2" />
              Settings
            </button>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm hover:scale-105 transition-transform">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-[#155ca5]/10 rounded-lg">
              <BookOpen className="w-6 h-6 text-[#155ca5]" />
            </div>
            <div className="text-3xl font-black">
              {stats.totalLessonsCompleted}
            </div>
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Lessons Completed
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm hover:scale-105 transition-transform">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-[#27ae60]/10 rounded-lg">
              <Trophy className="w-6 h-6 text-[#27ae60]" />
            </div>
            <div className="text-3xl font-black">{stats.totalTestsTaken}</div>
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Tests Taken
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm hover:scale-105 transition-transform">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-[#f39c12]/10 rounded-lg">
              <Target className="w-6 h-6 text-[#f39c12]" />
            </div>
            <div className="text-3xl font-black">
              {stats.averageScore.toFixed(1)}%
            </div>
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Average Score
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm hover:scale-105 transition-transform">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-[#e74c3c]/10 rounded-lg">
              <Flame className="w-6 h-6 text-[#e74c3c]" />
            </div>
            <div className="text-3xl font-black">{stats.longestStreak}</div>
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Longest Streak
          </div>
        </div>
      </section>

      {/* Learning Overview */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
            <Calendar className="w-7 h-7 text-[#155ca5]" />
            Recent Activity
          </h2>
          <div className="space-y-4">
            {history.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    item.type === "lesson"
                      ? "bg-[#155ca5]/10"
                      : item.type === "test"
                        ? "bg-[#27ae60]/10"
                        : "bg-[#f39c12]/10"
                  }`}
                >
                  {item.type === "lesson" && (
                    <BookOpen className="w-6 h-6 text-[#155ca5]" />
                  )}
                  {item.type === "test" && (
                    <Trophy className="w-6 h-6 text-[#27ae60]" />
                  )}
                  {item.type === "exercise" && (
                    <Target className="w-6 h-6 text-[#f39c12]" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold">{item.title}</h4>
                  <p className="text-sm text-gray-600">
                    Score: {item.score}% • +{item.xpGained} XP
                  </p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  {formatDate(item.completedAt)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
            <Award className="w-7 h-7 text-[#155ca5]" />
            Account Information
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600 font-medium">Email</span>
              <span className="font-bold">{user.email}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600 font-medium">Member Since</span>
              <span className="font-bold">{formatDate(user.joinedDate)}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600 font-medium">Account Type</span>
              <span
                className={`font-bold capitalize ${
                  user.vipStatus === "free"
                    ? "text-gray-600"
                    : user.vipStatus === "premium"
                      ? "text-purple-600"
                      : "text-amber-600"
                }`}
              >
                {user.vipStatus}
              </span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600 font-medium">Accuracy Rate</span>
              <span className="font-bold text-[#27ae60]">
                {stats.accuracy}%
              </span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-gray-600 font-medium">Total XP</span>
              <span className="font-bold text-[#155ca5]">
                {stats.totalXP.toLocaleString()}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={openPasswordModal}
            className="w-full mt-6 bg-[#155ca5]/10 text-[#155ca5] py-3 rounded-lg font-bold hover:bg-[#155ca5]/20 transition-colors flex items-center justify-center gap-2"
          >
            <KeyRound className="w-5 h-5" />
            Change Password
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={authLoading}
            className="w-full mt-6 bg-red-50 text-red-600 py-3 rounded-lg font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <LogOut className="w-5 h-5" />
            {authLoading ? "Signing out..." : "Sign Out"}
          </button>

          {logoutError && (
            <p className="mt-3 text-sm font-semibold text-red-600">
              {logoutError}
            </p>
          )}
        </div>
      </section>

      {isPasswordModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] px-4 flex items-center justify-center"
          onClick={closePasswordModal}
        >
          <div
            className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-black text-xl text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#155ca5]" />
              Change Password
            </h3>

            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Current Password"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#155ca5]/40"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#155ca5]/40"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm New Password"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#155ca5]/40"
            />

            {passwordError && (
              <p className="text-sm font-semibold text-red-600">
                {passwordError}
              </p>
            )}
            {passwordSuccess && (
              <p className="text-sm font-semibold text-green-600">
                {passwordSuccess} This dialog will close automatically.
              </p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={closePasswordModal}
                disabled={changingPassword}
                className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-md font-bold hover:bg-slate-200 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="flex-1 bg-[#155ca5] text-white py-2.5 rounded-md font-bold hover:brightness-105 transition-colors disabled:opacity-70"
              >
                {changingPassword ? "Changing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
