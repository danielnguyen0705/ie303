import { Link, useLocation, useNavigate } from "react-router";
import {
  Flame,
  Coins,
  User,
  LogOut,
  History,
  Package,
  X,
  ShieldCheck,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { getMyShopItems } from "@/api/shop";
import type { ShopItemType, UserItemResponse } from "@/api/types";
import { NotificationPopup } from "@/utils/NotificationPopup";
import { useNotificationPopup } from "@/utils/useNotificationPopup";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/ui/avatar";

type AuthMode = "login" | "register";

type InventoryItem = {
  id: string;
  name: string;
  icon: string;
  description: string;
  quantity: number;
  recommended?: boolean;
  userItemId?: number;
  itemType: ShopItemType;
  imageUrl?: string;
};

const ITEM_CONFIGS: Record<string, Partial<InventoryItem>> = {
  SKIP: {
    icon: "⏭️",
    description: "Skip item.",
    recommended: false,
  },
  VIP: {
    icon: "⭐",
    description: "Premium access item.",
    recommended: true,
  },
  EXP: {
    icon: "⚡",
    description: "Experience boost item.",
    recommended: true,
  },
};

const VISIBLE_INVENTORY_TYPES = new Set<ShopItemType>(["SKIP", "VIP", "EXP"]);

function mapInventoryItemsFromApi(
  userItems: UserItemResponse[],
): InventoryItem[] {
  return userItems
    .filter((item) => VISIBLE_INVENTORY_TYPES.has(item.type))
    .map((item) => {
      const config = ITEM_CONFIGS[item.type];

      return {
        id: `item-${item.userItemId}`,
        name: item.name,
        quantity: item.quantity,
        userItemId: item.userItemId,
        itemType: item.type,
        imageUrl: item.imageUrl,
        icon: config.icon ?? "📦",
        description: config.description ?? "Owned item.",
        recommended: config.recommended ?? false,
      };
    });
}

function getNumericField(
  source: Record<string, unknown> | null,
  keys: string[],
): number {
  if (!source) {
    return 0;
  }

  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return 0;
}

function getAvatarInitials(username: string | undefined): string {
  if (!username) {
    return "U";
  }

  const trimmed = username.trim();
  if (!trimmed) {
    return "U";
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function isVipActive(profile: Record<string, unknown> | null): boolean {
  const expiresAt = profile?.vipExpiredAt;

  if (typeof expiresAt === "string" && expiresAt.length > 0) {
    const expiresAtTime = new Date(expiresAt).getTime();
    return Number.isFinite(expiresAtTime) && expiresAtTime > Date.now();
  }

  return Boolean(profile?.isVip);
}

export function Navbar() {
  return <NavbarContent />;
}

function NavbarContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isInventoryLoading, setIsInventoryLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutIdsRef = useRef<number[]>([]);
  const authPopup = useNotificationPopup({
    autoClose: true,
    autoCloseDuration: 2500,
  });
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { language, setLanguage, copy } = useLanguage();
  const userProfile = (user ?? null) as Record<string, unknown> | null;
  const isVipUser = isVipActive(userProfile);
  const userAvatar =
    typeof user?.avatar === "string" && user.avatar.length > 0
      ? user.avatar
      : undefined;
  const userName = user?.username ?? user?.email ?? "User";

  const streakDays = getNumericField(userProfile, [
    "streak",
    "currentStreak",
    "streakCount",
  ]);
  const coinAmount = getNumericField(userProfile, [
    "coin",
    "coins",
    "totalCoins",
    "balance",
    "remainingCoin",
  ]);

  const isActive = (path: string) => location.pathname === path;
  const handleRegisterSuccess = useCallback(() => {
    authPopup.success({
      title: copy("Registration successful", "Đăng ký thành công"),
      message: copy(
        "Please verify your email before logging in.",
        "Vui lòng mở email để xác minh tài khoản trước khi đăng nhập.",
      ),
    });
  }, [authPopup, copy]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
    };
  }, []);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);

    const toastTimeoutId = window.setTimeout(() => {
      setToastMessage(null);
    }, 1800);

    timeoutIdsRef.current.push(toastTimeoutId);
  }, []);

  const loadInventoryItems = useCallback(async () => {
    if (!isAuthenticated) {
      setInventoryItems([]);
      return;
    }

    setIsInventoryLoading(true);
    const response = await getMyShopItems();

    if (!response.success || !response.data) {
      showToast(
        response.error?.message ||
          copy("Failed to load inventory.", "Không thể tải túi đồ."),
      );
      setIsInventoryLoading(false);
      return;
    }

    setInventoryItems(mapInventoryItemsFromApi(response.data));
    setIsInventoryLoading(false);
  }, [copy, isAuthenticated, showToast]);

  useEffect(() => {
    if (!isInventoryModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsInventoryModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    void loadInventoryItems();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isInventoryModalOpen, loadInventoryItems]);

  const handleLogout = async () => {
    await logout();
    setIsDropdownOpen(false);
    navigate("/");
  };

  const handleNavigateAndClose = (path: string) => {
    navigate(path);
    setIsDropdownOpen(false);
  };

  const handleOpenInventory = () => {
    setIsDropdownOpen(false);
    setIsInventoryModalOpen(true);
  };

  const handleLoginSuccess = (authenticatedUser: { role?: string }) => {
    if (authenticatedUser.role === "ADMIN") {
      navigate("/admin/users", { replace: true });
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="shrink-0 text-2xl font-black italic tracking-tighter text-[#155ca5]"
          >
            UIFIVE
          </Link>

          <div className="hidden items-center gap-6 text-sm font-medium lg:flex xl:gap-8">
            <Link
              to="/"
              className={`whitespace-nowrap transition-all duration-200 ${
                isActive("/")
                  ? "text-[#155ca5] font-bold border-b-2 border-[#155ca5] pb-1"
                  : "text-slate-600 hover:text-[#155ca5] hover:scale-105"
              }`}
            >
              {copy("Learn", "Học")}
            </Link>
            <Link
              to="/quests"
              className={`whitespace-nowrap transition-all duration-200 ${
                isActive("/quests")
                  ? "text-[#155ca5] font-bold border-b-2 border-[#155ca5] pb-1"
                  : "text-slate-600 hover:text-[#155ca5] hover:scale-105"
              }`}
            >
              {copy("Quests", "Nhiệm vụ")}
            </Link>
            <Link
              to="/leaderboard"
              className={`whitespace-nowrap transition-all duration-200 ${
                isActive("/leaderboard")
                  ? "text-[#155ca5] font-bold border-b-2 border-[#155ca5] pb-1"
                  : "text-slate-600 hover:text-[#155ca5] hover:scale-105"
              }`}
            >
              {copy("Leaderboard", "Xếp hạng")}
            </Link>
            <Link
              to="/shop"
              className={`whitespace-nowrap transition-all duration-200 ${
                isActive("/shop")
                  ? "text-[#155ca5] font-bold border-b-2 border-[#155ca5] pb-1"
                  : "text-slate-600 hover:text-[#155ca5] hover:scale-105"
              }`}
            >
              {copy("Shop", "Cửa hàng")}
            </Link>
            <Link
              to="/topup"
              className={`whitespace-nowrap transition-all duration-200 ${
                isActive("/topup")
                  ? "text-[#155ca5] font-bold border-b-2 border-[#155ca5] pb-1"
                  : "text-slate-600 hover:text-[#155ca5] hover:scale-105"
              }`}
            >
              {copy("Top Up", "Nạp tiền")}
            </Link>
          </div>

          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            {user?.role !== "ADMIN" && (
              <div className="hidden items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm lg:flex">
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                    language === "en"
                      ? "bg-[#155ca5] text-white"
                      : "text-slate-500 hover:text-[#155ca5]"
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("vi")}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                    language === "vi"
                      ? "bg-[#155ca5] text-white"
                      : "text-slate-500 hover:text-[#155ca5]"
                  }`}
                >
                  VI
                </button>
              </div>
            )}

            <div className="hidden items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 transition-all hover:scale-105 sm:flex lg:hidden xl:flex">
              <Flame className="w-4 h-4 text-[#f39c12]" fill="#f39c12" />
              <span className="font-bold text-sm">
                {isAuthenticated
                  ? `${streakDays} ${copy("Days", "Ngày")}`
                  : `0 ${copy("Days", "Ngày")}`}
              </span>
            </div>

            <div className="flex max-w-[9rem] items-center gap-2 rounded-full bg-yellow-50 px-3 py-1.5 transition-all hover:scale-105 sm:max-w-none">
              <Coins className="w-4 h-4 text-[#f1c40f]" fill="#f1c40f" />
              <span className="truncate text-sm font-bold">
                {isAuthenticated ? coinAmount.toLocaleString() : "0"}
              </span>
            </div>

            {isAuthenticated && user ? (
              <>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="relative group shrink-0 cursor-pointer transition-transform hover:scale-105"
                  >
                    <div
                      className={`w-10 h-10 rounded-full p-0.5 shadow-md ${
                        isVipUser
                          ? "bg-gradient-to-tr from-yellow-400 to-yellow-600"
                          : "bg-slate-200"
                      }`}
                    >
                      <Avatar className="h-full w-full rounded-full border-2 border-white bg-white">
                        <AvatarImage
                          src={userAvatar}
                          alt={`${userName} avatar`}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-white text-[11px] font-bold text-slate-500">
                          {getAvatarInitials(userName)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    {isVipUser && (
                      <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                        VIP
                      </div>
                    )}
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                      {user.role === "ADMIN" && (
                        <button
                          type="button"
                          onClick={() => handleNavigateAndClose("/admin/users")}
                          className="w-full px-4 py-2.5 text-left hover:bg-slate-100 text-slate-700 font-medium text-sm transition-colors flex items-center gap-3"
                        >
                          <ShieldCheck className="w-4 h-4 text-[#155ca5]" />
                          {copy("Admin Console", "Trang quản trị")}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleNavigateAndClose("/profile")}
                        className="w-full px-4 py-2.5 text-left hover:bg-slate-100 text-slate-700 font-medium text-sm transition-colors flex items-center gap-3"
                      >
                        <User className="w-4 h-4 text-[#155ca5]" />
                        {copy("Profile", "Hồ sơ")}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleNavigateAndClose("/payment-history")
                        }
                        className="w-full px-4 py-2.5 text-left hover:bg-slate-100 text-slate-700 font-medium text-sm transition-colors flex items-center gap-3"
                      >
                        <History className="w-4 h-4 text-[#155ca5]" />
                        {copy("Payment History", "Lịch sử nạp")}
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenInventory}
                        className="w-full px-4 py-2.5 text-left hover:bg-slate-100 text-slate-700 font-medium text-sm transition-colors flex items-center gap-3"
                      >
                        <Package className="w-4 h-4 text-[#155ca5]" />
                        {copy("Items", "Vật phẩm")}
                      </button>
                      <hr className="my-1" />
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full px-4 py-2.5 text-left hover:bg-red-50 text-red-600 font-medium text-sm transition-colors flex items-center gap-3"
                      >
                        <LogOut className="w-4 h-4" />
                        {copy("Log Out", "Đăng xuất")}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setIsAuthModalOpen(true);
                }}
                disabled={loading}
                className="rounded-lg bg-[#155ca5] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#124e8b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? copy("Loading...", "Đang tải...")
                  : copy("Login", "Đăng nhập")}
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-slate-100 bg-white py-3 lg:hidden">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 ${isActive("/") ? "text-[#155ca5]" : "text-slate-400"}`}
        >
          <span className="text-xs font-bold">{copy("Learn", "Học")}</span>
        </Link>
        <Link
          to="/quests"
          className={`flex flex-col items-center gap-1 ${isActive("/quests") ? "text-[#155ca5]" : "text-slate-400"}`}
        >
          <span className="text-xs font-bold">
            {copy("Quests", "Nhiệm vụ")}
          </span>
        </Link>
        <Link
          to="/leaderboard"
          className={`flex flex-col items-center gap-1 ${isActive("/leaderboard") ? "text-[#155ca5]" : "text-slate-400"}`}
        >
          <span className="text-xs font-bold">{copy("Ranks", "Xếp hạng")}</span>
        </Link>
        <Link
          to="/shop"
          className={`flex flex-col items-center gap-1 ${isActive("/shop") ? "text-[#155ca5]" : "text-slate-400"}`}
        >
          <span className="text-xs font-bold">{copy("Shop", "Cửa hàng")}</span>
        </Link>
        <Link
          to="/topup"
          className={`flex flex-col items-center gap-1 ${isActive("/topup") ? "text-[#155ca5]" : "text-slate-400"}`}
        >
          <span className="text-xs font-bold">
            {copy("Top Up", "Nạp tiền")}
          </span>
        </Link>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onRegisterSuccess={handleRegisterSuccess}
        onLoginSuccess={handleLoginSuccess}
        initialMode={authMode}
      />

      <NotificationPopup
        {...authPopup.notification}
        onClose={authPopup.close}
      />

      {isInventoryModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/35 px-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label={copy("Your Items", "Vật phẩm của bạn")}
          onClick={() => setIsInventoryModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-[18px] bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.22)] sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-800 sm:text-2xl">
                  {copy("Your Items", "Vật phẩm của bạn")}
                </h2>
                <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                  {copy(
                    "Showing only SKIP and VIP items.",
                    "Chỉ hiển thị vật phẩm SKIP và VIP.",
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsInventoryModalOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label={copy("Close items", "Đóng vật phẩm")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isInventoryLoading ? (
              <div className="flex min-h-32 items-center justify-center">
                <span className="h-8 w-8 animate-spin rounded-full border-4 border-[#155ca5]/20 border-t-[#155ca5]" />
              </div>
            ) : inventoryItems.length === 0 ? (
              <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm font-medium text-slate-500">
                {copy(
                  "No SKIP, VIP or EXP items.",
                  "Chưa có vật phẩm SKIP, VIP hoặc EXP.",
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {inventoryItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-3 shadow-sm sm:px-4"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white text-xl shadow-sm">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        item.icon
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate text-sm font-bold text-slate-800 sm:text-base">
                          {item.name}
                        </p>
                        <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-[#155ca5]">
                          {item.itemType}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                        {item.description}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-[#155ca5]">
                      x{item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed left-1/2 top-20 z-[70] -translate-x-1/2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg animate-[fadeIn_150ms_ease-out]">
          {toastMessage}
        </div>
      )}
    </>
  );
}
