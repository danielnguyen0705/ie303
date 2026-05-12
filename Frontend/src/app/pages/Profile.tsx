import { useState, useEffect } from "react";
import {
  Settings,
  LogOut,
  Flame,
  Coins,
  Zap,
  BookOpen,
  Target,
  Trophy,
  Loader2,
  Award,
  KeyRound,
  Lock,
  Palette,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  Minus,
  BrainCircuit,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import {
  changePassword as changePasswordApi,
  equipAvatar,
  equipBackground,
  getActiveShopItems,
  getCurrentUser,
  getMyShopItems,
} from "@/api";
import { useAuth } from "@/context/AuthContext";
import { ActivityCalendar } from "@/app/components/ActivityCalendar";
import { useLanguage } from "@/context/LanguageContext";

type CurrentUserProfile = {
  id: number;
  username: string;
  email: string;
  role: string;
  coin: number;
  exp: number;
  score: number;
  streak: number;
  lastStudyDate?: string;
  vipExpiredAt?: string | null;
  isVip: boolean;
  createdAt: string;
  studyingGrades?: Array<{
    gradeId: number;
    gradeName: string;
    progressPercent: number;
  }>;
  strongSkill?: string;
  weakSkill?: string;
  trendLabel?: string;
};

type ProfileUser = {
  id: number;
  username: string;
  email: string;
  role: string;
  avatar: string;
  avatarItemId: number | null;
  backgroundImageUrl: string | null;
  backgroundItemId: number | null;
  streak: number;
  lastStudyDate: string | null;
  vipExpiredAt: string | null;
  isVip: boolean;
  createdAt: string;
  studyProgress: number;
  strongSkill: string | null;
  weakSkill: string | null;
  trendLabel: string | null;
};

type CosmeticOption = {
  id: number;
  name: string;
  imageUrl: string;
  owned: boolean;
  equipped: boolean;
};

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

type StudyingGrade = {
  gradeId: number;
  gradeName: string;
  progressPercent: number;
};

type StreakStatus = {
  label: string;
  description: string;
  className: string;
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

const sortCosmeticOptions = (options: CosmeticOption[]): CosmeticOption[] => {
  return [...options].sort((a, b) => {
    if (a.owned !== b.owned) {
      return a.owned ? -1 : 1;
    }
    if (a.equipped !== b.equipped) {
      return a.equipped ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
};

function getStreakStatus(user: ProfileUser | null): StreakStatus {
  if (!user) {
    return {
      label: "Unknown",
      description: "No profile loaded yet.",
      className: "bg-gray-100 text-gray-600",
    };
  }

  if (user.streak <= 0) {
    return user.lastStudyDate
      ? {
          label: "Reset",
          description: "No active streak right now.",
          className: "bg-red-50 text-red-700",
        }
      : {
          label: "New User",
          description: "Has not started a streak yet.",
          className: "bg-slate-100 text-slate-600",
        };
  }

  return {
    label: "Active",
    description: "Streak is currently active.",
    className: "bg-green-50 text-green-700",
  };
}

export function Profile() {
  const { copy } = useLanguage();
  const { logout, loading: authLoading } = useAuth();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [stats, setStats] = useState<UserStats>(initialStats);
  const [studyingGrades, setStudyingGrades] = useState<StudyingGrade[]>([]);
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
  const [avatarOptions, setAvatarOptions] = useState<CosmeticOption[]>([]);
  const [backgroundOptions, setBackgroundOptions] = useState<CosmeticOption[]>(
    [],
  );
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState<number | null>(null);
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<
    number | null
  >(null);
  const [customizationError, setCustomizationError] = useState<string | null>(
    null,
  );
  const [savingCustomization, setSavingCustomization] = useState(false);
  const [isAvatarPickerModalOpen, setIsAvatarPickerModalOpen] = useState(false);
  const [isBackgroundPickerModalOpen, setIsBackgroundPickerModalOpen] =
    useState(false);

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

      const [userResponse, shopItemsResponse, myItemsResponse] =
        await Promise.all([
          getCurrentUser(),
          getActiveShopItems(),
          getMyShopItems(),
        ]);

      if (userResponse.success && userResponse.data) {
        const currentUser = userResponse.data as CurrentUserProfile;
        const allShopItems =
          shopItemsResponse.success && shopItemsResponse.data
            ? shopItemsResponse.data
            : [];
        const ownedItems =
          myItemsResponse.success && myItemsResponse.data
            ? myItemsResponse.data
            : [];
        const ownedShopItemIds = new Set(
          ownedItems.map((ownedItem) => ownedItem.shopItemId),
        );

        const equippedAvatarId =
          ownedItems.find((item) => item.type === "AVATAR" && item.equipped)
            ?.shopItemId ?? null;
        const equippedBackgroundId =
          ownedItems.find((item) => item.type === "BACKGROUND" && item.equipped)
            ?.shopItemId ?? null;

        const mappedAvatarOptions: CosmeticOption[] = allShopItems
          .filter((item) => item.shopType === "AVATAR")
          .map((item) => ({
            id: Number(item.id),
            name: item.name,
            imageUrl: item.imageUrl || "",
            owned: ownedShopItemIds.has(Number(item.id)),
            equipped: equippedAvatarId === Number(item.id),
          }));

        const mappedBackgroundOptions: CosmeticOption[] = allShopItems
          .filter((item) => item.shopType === "BACKGROUND")
          .map((item) => ({
            id: Number(item.id),
            name: item.name,
            imageUrl: item.imageUrl || "",
            owned: ownedShopItemIds.has(Number(item.id)),
            equipped: equippedBackgroundId === Number(item.id),
          }));

        setAvatarOptions(sortCosmeticOptions(mappedAvatarOptions));
        setBackgroundOptions(sortCosmeticOptions(mappedBackgroundOptions));
        setSelectedAvatarId(equippedAvatarId);
        setSelectedBackgroundId(equippedBackgroundId);

        const equippedAvatarImage = mappedAvatarOptions.find(
          (item) => item.id === equippedAvatarId,
        )?.imageUrl;
        const equippedBackgroundImage = mappedBackgroundOptions.find(
          (item) => item.id === equippedBackgroundId,
        )?.imageUrl;
        const studyProgress =
          currentUser.studyingGrades && currentUser.studyingGrades.length > 0
            ? currentUser.studyingGrades.reduce(
                (acc, grade) => acc + Number(grade.progressPercent || 0),
                0,
              ) / currentUser.studyingGrades.length
            : 0;

        setUser({
          id: Number(currentUser.id),
          username: currentUser.username,
          email: currentUser.email,
          role: currentUser.role,
          avatar:
            equippedAvatarImage ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.username || "User")}`,
          avatarItemId: equippedAvatarId,
          backgroundImageUrl: equippedBackgroundImage || null,
          backgroundItemId: equippedBackgroundId,
          streak: Number(currentUser.streak ?? 0),
          lastStudyDate: currentUser.lastStudyDate ?? null,
          vipExpiredAt: currentUser.vipExpiredAt ?? null,
          isVip: Boolean(currentUser.isVip),
          createdAt: currentUser.createdAt,
          studyProgress,
          strongSkill: currentUser.strongSkill ?? null,
          weakSkill: currentUser.weakSkill ?? null,
          trendLabel: currentUser.trendLabel ?? null,
        });

        setStats((prev) => ({
          ...prev,
          totalXP: Number(currentUser.exp ?? 0),
          totalCoins: Number(currentUser.coin ?? 0),
          currentStreak: Number(currentUser.streak ?? 0),
          longestStreak: Number(currentUser.streak ?? 0),
          accuracy: Number(studyProgress ?? 0),
          averageScore: Number(currentUser.score ?? 0),
        }));
      } else {
        setError(
          copy("Failed to load profile data", "Không thể tải dữ liệu hồ sơ"),
        );
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      setError(
        copy("Failed to load profile data", "Không thể tải dữ liệu hồ sơ"),
      );
    } finally {
      setLoading(false);
    }
  };

  const getVIPBadge = (isVip: boolean) => {
    if (isVip) return { label: "VIP Member", color: "bg-amber-600" };
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
        setPasswordError(
          response.error?.message ||
            copy("Change password failed.", "Đổi mật khẩu thất bại."),
        );
        return;
      }

      setPasswordSuccess(
        copy("Password changed successfully.", "Đổi mật khẩu thành công."),
      );
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Error changing password:", err);
      setPasswordError(
        copy(
          "Change password failed. Please try again.",
          "Đổi mật khẩu thất bại. Vui lòng thử lại.",
        ),
      );
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

  const openCustomizeModal = () => {
    if (!user) {
      return;
    }

    setCustomizationError(null);
    setSelectedAvatarId(user.avatarItemId);
    setSelectedBackgroundId(user.backgroundItemId);
    setIsAvatarPickerModalOpen(false);
    setIsBackgroundPickerModalOpen(false);
    setIsCustomizeModalOpen(true);
  };

  const closeCustomizeModal = () => {
    if (savingCustomization) {
      return;
    }

    setCustomizationError(null);
    setIsAvatarPickerModalOpen(false);
    setIsBackgroundPickerModalOpen(false);
    setIsCustomizeModalOpen(false);
  };

  const handleSaveCustomization = async () => {
    if (!user) {
      return;
    }

    setCustomizationError(null);
    setSavingCustomization(true);

    try {
      const avatarChanged =
        selectedAvatarId !== null && selectedAvatarId !== user.avatarItemId;
      const backgroundChanged =
        selectedBackgroundId !== null &&
        selectedBackgroundId !== user.backgroundItemId;

      if (avatarChanged) {
        const response = await equipAvatar(selectedAvatarId);
        if (!response.success) {
          setCustomizationError(
            response.error?.message ||
              copy("Failed to equip avatar.", "Không thể trang bị avatar."),
          );
          return;
        }
      }

      if (backgroundChanged) {
        const response = await equipBackground(selectedBackgroundId);
        if (!response.success) {
          setCustomizationError(
            response.error?.message ||
              copy(
                "Failed to equip background.",
                "Không thể trang bị ảnh nền.",
              ),
          );
          return;
        }
      }

      const selectedAvatar = avatarOptions.find(
        (option) => option.id === selectedAvatarId,
      );
      const selectedBackground = backgroundOptions.find(
        (option) => option.id === selectedBackgroundId,
      );

      setAvatarOptions((prev) =>
        sortCosmeticOptions(
          prev.map((item) => ({
            ...item,
            equipped: selectedAvatarId !== null && item.id === selectedAvatarId,
          })),
        ),
      );
      setBackgroundOptions((prev) =>
        sortCosmeticOptions(
          prev.map((item) => ({
            ...item,
            equipped:
              selectedBackgroundId !== null && item.id === selectedBackgroundId,
          })),
        ),
      );

      setUser((prev) =>
        prev
          ? {
              ...prev,
              avatar:
                selectedAvatar?.imageUrl ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(prev.username || "User")}`,
              avatarItemId: selectedAvatarId,
              backgroundImageUrl: selectedBackground?.imageUrl || null,
              backgroundItemId: selectedBackgroundId,
            }
          : prev,
      );

      setIsCustomizeModalOpen(false);
    } catch (err) {
      console.error("Failed to save customization:", err);
      setCustomizationError(
        copy(
          "Failed to save customization. Please try again.",
          "Không thể lưu tùy chỉnh. Vui lòng thử lại.",
        ),
      );
    } finally {
      setSavingCustomization(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    setLogoutError(null);
    const isSuccess = await logout();

    if (!isSuccess) {
      setLogoutError(
        copy(
          "Unable to logout right now. Please try again.",
          "Hiện không thể đăng xuất. Vui lòng thử lại.",
        ),
      );
    }
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-10 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#155ca5] animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">
            {copy("Loading profile...", "Đang tải hồ sơ...")}
          </p>
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
            {copy("Retry", "Thử lại")}
          </button>
        </div>
      </main>
    );
  }

  if (!user) return null;

  const vipBadge = getVIPBadge(user.isVip);
  const selectedAvatarOption =
    avatarOptions.find((item) => item.id === selectedAvatarId) ||
    avatarOptions.find((item) => item.equipped) ||
    null;
  const selectedBackgroundOption =
    backgroundOptions.find((item) => item.id === selectedBackgroundId) ||
    backgroundOptions.find((item) => item.equipped) ||
    null;
  const streakStatus = getStreakStatus(user);

  return (
    <main className="pt-12 px-4 md:px-8 max-w-7xl mx-auto space-y-8 pb-24 md:pb-12">
      {/* Header Profile Card */}
      <section className="relative">
        <div
          className="bg-white rounded-lg p-8 md:p-12 shadow-sm flex flex-col md:flex-row items-center gap-8 overflow-hidden relative"
          style={
            user.backgroundImageUrl
              ? {
                  backgroundImage: `linear-gradient(rgba(255,255,255,0.86), rgba(255,255,255,0.86)), url(${user.backgroundImageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          {/* Decorative element */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#73aaf9]/20 rounded-full blur-3xl" />
          <div className="relative group">
            <div className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-[#155ca5]/10 p-1 bg-white">
              <img
                src={user.avatar}
                alt={user.username}
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
                {user.username}
              </h1>
              <p className="font-mono text-[#155ca5] font-bold uppercase tracking-widest text-sm">
                {user.role} • ID #{user.id}
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
                  {stats.currentStreak} {copy("day Streak", "ngày streak")}
                </span>
              </div>
              <div
                className={`flex items-center gap-2 px-6 py-3 rounded-full hover:scale-105 transition-transform cursor-pointer ${streakStatus.className}`}
                title={streakStatus.description}
              >
                <span className="font-black uppercase tracking-wider text-xs">
                  {streakStatus.label}
                </span>
              </div>
            </div>
          </div>
          <div className="w-full md:w-auto flex flex-col gap-3">
            <button
              type="button"
              onClick={openCustomizeModal}
              className="bg-[#155ca5] text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg shadow-[#155ca5]/20 hover:scale-105 active:scale-95 transition-all"
            >
              {copy("Edit Profile", "Chỉnh hồ sơ")}
            </button>
            <button className="bg-gray-100 text-gray-700 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-200 transition-colors">
              <Settings className="w-5 h-5 inline mr-2" />
              {copy("Settings", "Cài đặt")}
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
            {copy("Lessons Completed", "Bài học đã hoàn thành")}
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
            {copy("Tests Taken", "Bài kiểm tra đã làm")}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm hover:scale-105 transition-transform">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-[#f39c12]/10 rounded-lg">
              <Target className="w-6 h-6 text-[#f39c12]" />
            </div>
            <div className="text-3xl font-black">
              {Math.round(stats.averageScore).toLocaleString()}
            </div>
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-500">
            {copy("Score", "Điểm")}
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
            {copy("Longest Streak", "Streak dài nhất")}
          </div>
        </div>
      </section>

      {/* ML AI Predictions */}
      <section className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-7 h-7 text-[#155ca5]" />
          <h2 className="text-2xl font-black">
            {copy("AI Learning Insights", "Phân tích học tập AI")}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Strong Skill */}
          <div className="bg-green-50 rounded-xl p-5 border border-green-100 flex flex-col justify-between hover:scale-105 transition-transform">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BrainCircuit className="w-5 h-5 text-green-600" />
              </div>
              <span className="font-bold text-green-700 uppercase tracking-wider text-sm">
                {copy("Strongest Skill", "Kỹ năng mạnh nhất")}
              </span>
            </div>
            <div className="text-2xl font-black text-green-800 capitalize">
              {user.strongSkill || copy("Not enough data", "Chưa đủ dữ liệu")}
            </div>
          </div>

          {/* Weak Skill */}
          <div className="bg-red-50 rounded-xl p-5 border border-red-100 flex flex-col justify-between hover:scale-105 transition-transform">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <span className="font-bold text-red-700 uppercase tracking-wider text-sm">
                {copy("Needs Improvement", "Cần cải thiện")}
              </span>
            </div>
            <div className="text-2xl font-black text-red-800 capitalize">
              {user.weakSkill || copy("Not enough data", "Chưa đủ dữ liệu")}
            </div>
          </div>

          {/* Learning Trend */}
          <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 flex flex-col justify-between hover:scale-105 transition-transform">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                {user.trendLabel === "IMPROVING" ? (
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                ) : user.trendLabel === "DECLINING" ? (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                ) : (
                  <Minus className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <span className="font-bold text-blue-700 uppercase tracking-wider text-sm">
                {copy("Learning Trend", "Xu hướng học")}
              </span>
            </div>
            <div className="text-2xl font-black text-blue-800 capitalize">
              {user.trendLabel
                ? user.trendLabel.toLowerCase()
                : copy("Not enough data", "Chưa đủ dữ liệu")}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex items-center justify-between gap-3 mb-6">
          <h2 className="text-2xl font-black flex items-center gap-3">
            <GraduationCap className="w-7 h-7 text-[#155ca5]" />
            {copy("Studying Grades", "Lớp đang học")}
          </h2>
          {studyingGrades.length > 0 && (
            <div className="rounded-full bg-[#155ca5]/10 px-4 py-2 text-sm font-bold text-[#155ca5]">
              {studyingGrades.length}{" "}
              {copy(
                studyingGrades.length !== 1
                  ? "grades in progress"
                  : "grade in progress",
                "lớp đang học",
              )}
            </div>
          )}
        </div>

        {studyingGrades.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {studyingGrades.map((grade) => (
              <div
                key={grade.gradeId}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-black text-[#1e2e51]">
                    {grade.gradeName}
                  </div>
                  <span className="text-xs font-bold text-[#155ca5]">
                    {Math.round(grade.progressPercent)}%
                  </span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#155ca5]"
                    style={{
                      width: `${Math.min(100, Math.max(0, grade.progressPercent))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-gray-500">
            {copy(
              "No studying grades found yet.",
              "Chưa tìm thấy lớp đang học.",
            )}
          </div>
        )}
      </section>

      {/* Learning Overview */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ActivityCalendar />

        {/* Account Info */}
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
            <Award className="w-7 h-7 text-[#155ca5]" />
            {copy("Account Information", "Thông tin tài khoản")}
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600 font-medium">Email</span>
              <span className="font-bold">{user.email}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600 font-medium">
                {copy("Member Since", "Tham gia từ")}
              </span>
              <span className="font-bold">{formatDate(user.createdAt)}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600 font-medium">
                {copy("Account Type", "Loại tài khoản")}
              </span>
              <span
                className={`font-bold capitalize ${
                  user.isVip ? "text-amber-600" : "text-gray-600"
                }`}
              >
                {user.isVip ? "VIP" : copy("Free", "Miễn phí")}
              </span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600 font-medium">Role</span>
              <span className="font-bold text-[#155ca5]">{user.role}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600 font-medium">
                {copy("Last Study Date", "Ngày học gần nhất")}
              </span>
              <span className="font-bold">
                {user.lastStudyDate
                  ? formatDate(user.lastStudyDate)
                  : copy("N/A", "Chưa có")}
              </span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600 font-medium">
                {copy("Streak Status", "Trạng thái streak")}
              </span>
              <span
                className={`font-bold rounded-full px-3 py-1 text-xs uppercase tracking-widest ${streakStatus.className}`}
                title={streakStatus.description}
              >
                {streakStatus.label}
              </span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600 font-medium">
                {copy("Study Progress", "Tiến độ học")}
              </span>
              <span className="font-bold text-[#27ae60]">
                {stats.accuracy.toFixed(1)}%
              </span>
            </div>
            {user.isVip && user.vipExpiredAt && (
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600 font-medium">
                  {copy("VIP Expires", "VIP hết hạn")}
                </span>
                <span className="font-bold text-amber-600">
                  {formatDate(user.vipExpiredAt)}
                </span>
              </div>
            )}
            <div className="flex justify-between py-3">
              <span className="text-gray-600 font-medium">
                {copy("Total XP", "Tổng XP")}
              </span>
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
            {copy("Change Password", "Đổi mật khẩu")}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={authLoading}
            className="w-full mt-6 bg-red-50 text-red-600 py-3 rounded-lg font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <LogOut className="w-5 h-5" />
            {authLoading
              ? copy("Signing out...", "Đang đăng xuất...")
              : copy("Sign Out", "Đăng xuất")}
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
              {copy("Change Password", "Đổi mật khẩu")}
            </h3>

            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder={copy("Current Password", "Mật khẩu hiện tại")}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#155ca5]/40"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={copy("New Password", "Mật khẩu mới")}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#155ca5]/40"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={copy(
                "Confirm New Password",
                "Xác nhận mật khẩu mới",
              )}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#155ca5]/40"
            />

            {passwordError && (
              <p className="text-sm font-semibold text-red-600">
                {passwordError}
              </p>
            )}
            {passwordSuccess && (
              <p className="text-sm font-semibold text-green-600">
                {passwordSuccess}{" "}
                {copy(
                  "This dialog will close automatically.",
                  "Hộp thoại sẽ tự đóng.",
                )}
              </p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={closePasswordModal}
                disabled={changingPassword}
                className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-md font-bold hover:bg-slate-200 transition-colors disabled:opacity-60"
              >
                {copy("Cancel", "Hủy")}
              </button>
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="flex-1 bg-[#155ca5] text-white py-2.5 rounded-md font-bold hover:brightness-105 transition-colors disabled:opacity-70"
              >
                {changingPassword
                  ? copy("Changing...", "Đang đổi...")
                  : copy("Confirm", "Xác nhận")}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCustomizeModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] px-4 py-6 flex items-center justify-center"
          onClick={closeCustomizeModal}
        >
          <div
            className="w-full max-w-2xl max-h-[84vh] overflow-y-auto bg-white rounded-xl shadow-xl p-4 md:p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-black text-xl md:text-2xl text-slate-900 flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#155ca5]" />
                {copy("Customize Profile", "Tùy chỉnh hồ sơ")}
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base md:text-lg text-slate-900">
                  {copy("Avatars", "Avatar")}
                </h4>
                <span className="text-xs font-semibold text-slate-500">
                  {avatarOptions.filter((item) => item.owned).length}/
                  {avatarOptions.length} {copy("owned", "đã sở hữu")}
                </span>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/60">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#155ca5]/20 bg-slate-100 shrink-0">
                      {selectedAvatarOption?.imageUrl ? (
                        <img
                          src={selectedAvatarOption.imageUrl}
                          alt={selectedAvatarOption.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={user.avatar}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {copy("Current avatar", "Avatar hiện tại")}
                      </p>
                      <p className="font-bold text-slate-900 truncate">
                        {selectedAvatarOption?.name ||
                          copy("Default avatar", "Avatar mặc định")}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAvatarPickerModalOpen(true)}
                    className="px-3 py-2 rounded-md bg-[#155ca5] text-white text-sm font-bold hover:brightness-105 transition-colors"
                  >
                    {copy("Edit avatar", "Đổi avatar")}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base md:text-lg text-slate-900">
                  {copy("Backgrounds", "Ảnh nền")}
                </h4>
                <span className="text-xs font-semibold text-slate-500">
                  {backgroundOptions.filter((item) => item.owned).length}/
                  {backgroundOptions.length} {copy("owned", "đã sở hữu")}
                </span>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {copy("Current background", "Ảnh nền hiện tại")}
                    </p>
                    <p className="font-bold text-slate-900 truncate">
                      {selectedBackgroundOption?.name ||
                        copy("Default background", "Ảnh nền mặc định")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsBackgroundPickerModalOpen(true)}
                    className="px-3 py-2 rounded-md bg-[#155ca5] text-white text-sm font-bold hover:brightness-105 transition-colors"
                  >
                    {copy("Edit background", "Đổi ảnh nền")}
                  </button>
                </div>

                <div className="h-24 md:h-28 rounded-md overflow-hidden bg-slate-100 border border-slate-200">
                  {selectedBackgroundOption?.imageUrl ? (
                    <img
                      src={selectedBackgroundOption.imageUrl}
                      alt={selectedBackgroundOption.name}
                      className="w-full h-full object-cover"
                    />
                  ) : user.backgroundImageUrl ? (
                    <img
                      src={user.backgroundImageUrl}
                      alt={`${user.username} background`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-xs text-slate-500">
                      {copy("No Image", "Không có ảnh")}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {customizationError && (
              <p className="text-sm font-semibold text-red-600">
                {customizationError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={closeCustomizeModal}
                disabled={savingCustomization}
                className="px-4 py-2 rounded-md bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors disabled:opacity-60"
              >
                {copy("Cancel", "Hủy")}
              </button>
              <button
                type="button"
                onClick={handleSaveCustomization}
                disabled={savingCustomization}
                className="px-4 py-2 rounded-md bg-[#155ca5] text-white font-bold hover:brightness-105 transition-colors disabled:opacity-70"
              >
                {savingCustomization
                  ? copy("Saving...", "Đang lưu...")
                  : copy("Save changes", "Lưu thay đổi")}
              </button>
            </div>
          </div>

          {isAvatarPickerModalOpen && (
            <div
              className="fixed inset-0 z-[60] bg-black/45 px-4 py-6 flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                setIsAvatarPickerModalOpen(false);
              }}
            >
              <div
                className="w-full max-w-xl max-h-[82vh] bg-white rounded-xl shadow-xl flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <h4 className="font-black text-lg text-slate-900 text-center">
                    {copy("Choose Avatar", "Chọn avatar")}
                  </h4>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {avatarOptions.map((item) => {
                      const isLocked = !item.owned;
                      const isSelected = selectedAvatarId === item.id;

                      return (
                        <button
                          key={`avatar-modal-${item.id}`}
                          type="button"
                          onClick={() => {
                            if (isLocked) {
                              return;
                            }
                            setSelectedAvatarId(item.id);
                          }}
                          className={`relative rounded-lg border p-2 text-left transition-all ${
                            isSelected
                              ? "border-[#155ca5] bg-[#155ca5]/5"
                              : "border-slate-200 hover:border-slate-300"
                          } ${isLocked ? "opacity-70" : ""}`}
                        >
                          <div className="aspect-square rounded-md overflow-hidden bg-slate-100">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full grid place-items-center text-xs text-slate-500">
                                {copy("No Image", "Không có ảnh")}
                              </div>
                            )}
                          </div>
                          <p className="mt-1.5 text-xs md:text-sm font-semibold truncate">
                            {item.name}
                          </p>
                          {item.equipped && (
                            <span className="inline-block text-[11px] font-bold text-[#155ca5]">
                              {copy("Equipped", "Đang dùng")}
                            </span>
                          )}
                          {isLocked && (
                            <div className="absolute inset-0 rounded-lg bg-black/35 grid place-items-center">
                              <div className="bg-white text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                {copy("Locked", "Đã khóa")}
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-200 p-4 bg-white">
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setIsAvatarPickerModalOpen(false)}
                      className="px-6 py-2.5 rounded-md bg-[#155ca5] text-white font-bold hover:brightness-105 transition-colors"
                    >
                      {copy("Save", "Lưu")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isBackgroundPickerModalOpen && (
            <div
              className="fixed inset-0 z-[60] bg-black/45 px-4 py-6 flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                setIsBackgroundPickerModalOpen(false);
              }}
            >
              <div
                className="w-full max-w-2xl max-h-[82vh] bg-white rounded-xl shadow-xl flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <h4 className="font-black text-lg text-slate-900 text-center">
                    {copy("Choose Background", "Chọn ảnh nền")}
                  </h4>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {backgroundOptions.map((item) => {
                      const isLocked = !item.owned;
                      const isSelected = selectedBackgroundId === item.id;

                      return (
                        <button
                          key={`background-modal-${item.id}`}
                          type="button"
                          onClick={() => {
                            if (isLocked) {
                              return;
                            }
                            setSelectedBackgroundId(item.id);
                          }}
                          className={`relative rounded-lg border p-2 text-left transition-all ${
                            isSelected
                              ? "border-[#155ca5] bg-[#155ca5]/5"
                              : "border-slate-200 hover:border-slate-300"
                          } ${isLocked ? "opacity-70" : ""}`}
                        >
                          <div className="h-20 rounded-md overflow-hidden bg-slate-100">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full grid place-items-center text-xs text-slate-500">
                                {copy("No Image", "Không có ảnh")}
                              </div>
                            )}
                          </div>
                          <p className="mt-1.5 text-xs md:text-sm font-semibold truncate">
                            {item.name}
                          </p>
                          {item.equipped && (
                            <span className="inline-block text-[11px] font-bold text-[#155ca5]">
                              {copy("Equipped", "Đang dùng")}
                            </span>
                          )}
                          {isLocked && (
                            <div className="absolute inset-0 rounded-lg bg-black/35 grid place-items-center">
                              <div className="bg-white text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                {copy("Locked", "Đã khóa")}
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-200 p-4 bg-white">
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setIsBackgroundPickerModalOpen(false)}
                      className="px-6 py-2.5 rounded-md bg-[#155ca5] text-white font-bold hover:brightness-105 transition-colors"
                    >
                      {copy("Save", "Lưu")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
