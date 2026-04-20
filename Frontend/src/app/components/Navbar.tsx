import { Link, useLocation, useNavigate } from "react-router";
import { Flame, Coins, User, LogOut, History, Backpack, X } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/context/AuthContext";
import { getMyShopItems, useSkipItem } from "@/api/shop";
import type { UserItemResponse } from "@/api/types";

type InventoryItem = {
  id: string;
  name: string;
  icon: string;
  description: string;
  quantity: number;
  recommended?: boolean;
  userItemId?: number;
  useMode?: "skip";
};

const INITIAL_INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: "streak-freeze",
    name: "Streak Freeze",
    icon: "❄️",
    description: "Protect your streak if you miss one day.",
    quantity: 0,
  },
  {
    id: "skip-lesson",
    name: "Skip Lesson",
    icon: "⏭️",
    description: "Skip one lesson and keep your progress moving.",
    quantity: 0,
  },
  {
    id: "xp-boost",
    name: "XP Boost",
    icon: "⚡",
    description: "Earn bonus XP on your next completed lesson.",
    quantity: 0,
    recommended: true,
  },
];

const containsAny = (value: string, tokens: string[]): boolean => {
  const normalized = value.toLowerCase();
  return tokens.some((token) => normalized.includes(token));
};

function mapInventoryItemsFromApi(
  userItems: UserItemResponse[],
): InventoryItem[] {
  const skipItems = userItems.filter((item) => item.type === "SKIP");
  const expItems = userItems.filter((item) => item.type === "EXP");

  const freezeItem =
    skipItems.find((item) => containsAny(item.name, ["freeze", "streak"])) ??
    null;

  const skipLessonItem =
    skipItems.find(
      (item) =>
        item.userItemId !== freezeItem?.userItemId &&
        containsAny(item.name, ["skip", "lesson"]),
    ) ??
    skipItems.find((item) => item.userItemId !== freezeItem?.userItemId) ??
    null;

  const xpBoostItem =
    expItems.find((item) => containsAny(item.name, ["xp", "exp", "boost"])) ??
    expItems[0] ??
    null;

  return INITIAL_INVENTORY_ITEMS.map((item) => {
    if (item.id === "streak-freeze") {
      return {
        ...item,
        quantity: freezeItem?.quantity ?? 0,
        userItemId: freezeItem?.userItemId,
        useMode: freezeItem ? "skip" : undefined,
      };
    }

    if (item.id === "skip-lesson") {
      return {
        ...item,
        quantity: skipLessonItem?.quantity ?? 0,
        userItemId: skipLessonItem?.userItemId,
        useMode: skipLessonItem ? "skip" : undefined,
      };
    }

    return {
      ...item,
      quantity: xpBoostItem?.quantity ?? 0,
      userItemId: xpBoostItem?.userItemId,
      useMode: undefined,
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

export function Navbar() {
  return <NavbarContent />;
}

function NavbarContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(
    INITIAL_INVENTORY_ITEMS,
  );
  const [isInventoryLoading, setIsInventoryLoading] = useState(false);
  const [usingItemId, setUsingItemId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutIdsRef = useRef<number[]>([]);
  const { user, loading, isAuthenticated, logout } = useAuth();
  const userProfile = (user ?? null) as Record<string, unknown> | null;

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

  // Close dropdown when clicking outside
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

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isInventoryModalOpen]);

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
      setInventoryItems(INITIAL_INVENTORY_ITEMS);
      return;
    }

    setIsInventoryLoading(true);
    const response = await getMyShopItems();

    if (!response.success || !response.data) {
      showToast(response.error?.message || "Failed to load inventory.");
      setIsInventoryLoading(false);
      return;
    }

    setInventoryItems(mapInventoryItemsFromApi(response.data));
    setIsInventoryLoading(false);
  }, [isAuthenticated, showToast]);

  useEffect(() => {
    if (!isInventoryModalOpen) {
      return;
    }

    void loadInventoryItems();
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

  const handleUseInventoryItem = async (itemId: string) => {
    if (usingItemId) {
      return;
    }

    const selectedItem = inventoryItems.find((item) => item.id === itemId);
    if (!selectedItem || selectedItem.quantity <= 0) {
      return;
    }

    if (selectedItem.useMode !== "skip" || !selectedItem.userItemId) {
      showToast("Item này chưa có API dùng trực tiếp.");
      return;
    }

    setUsingItemId(itemId);

    const response = await useSkipItem(selectedItem.userItemId);

    if (!response.success) {
      showToast(response.error?.message || "Use item failed.");
      setUsingItemId(null);
      return;
    }

    await loadInventoryItems();
    setUsingItemId(null);

    showToast(
      typeof response.data === "string"
        ? response.data
        : `${selectedItem.icon} ${selectedItem.name} activated!`,
    );
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          {/* Logo */}
          <Link
            to="/"
            className="text-2xl font-black italic text-[#155ca5] tracking-tighter"
          >
            UIFIVE
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8 font-medium text-sm">
            <Link
              to="/"
              className={`transition-all duration-200 ${
                isActive("/")
                  ? "text-[#155ca5] font-bold border-b-2 border-[#155ca5] pb-1"
                  : "text-slate-600 hover:text-[#155ca5] hover:scale-105"
              }`}
            >
              Learn
            </Link>
            <Link
              to="/quests"
              className={`transition-all duration-200 ${
                isActive("/quests")
                  ? "text-[#155ca5] font-bold border-b-2 border-[#155ca5] pb-1"
                  : "text-slate-600 hover:text-[#155ca5] hover:scale-105"
              }`}
            >
              Quests
            </Link>
            <Link
              to="/leaderboard"
              className={`transition-all duration-200 ${
                isActive("/leaderboard")
                  ? "text-[#155ca5] font-bold border-b-2 border-[#155ca5] pb-1"
                  : "text-slate-600 hover:text-[#155ca5] hover:scale-105"
              }`}
            >
              Leaderboard
            </Link>
            <Link
              to="/shop"
              className={`transition-all duration-200 ${
                isActive("/shop")
                  ? "text-[#155ca5] font-bold border-b-2 border-[#155ca5] pb-1"
                  : "text-slate-600 hover:text-[#155ca5] hover:scale-105"
              }`}
            >
              Shop
            </Link>
            <Link
              to="/topup"
              className={`transition-all duration-200 ${
                isActive("/topup")
                  ? "text-[#155ca5] font-bold border-b-2 border-[#155ca5] pb-1"
                  : "text-slate-600 hover:text-[#155ca5] hover:scale-105"
              }`}
            >
              Topup
            </Link>
          </div>

          {/* User Stats & Avatar */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Open inventory"
              onClick={() => setIsInventoryModalOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-[#155ca5] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-100 hover:text-[#124e8b]"
            >
              <Backpack className="h-4 w-4" />
            </button>

            {/* Streak */}
            <div className="hidden sm:flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-full hover:scale-105 transition-all cursor-pointer">
              <Flame className="w-4 h-4 text-[#f39c12]" fill="#f39c12" />
              <span className="font-bold text-sm">
                {isAuthenticated ? `${streakDays} Days` : "0 Days"}
              </span>
            </div>

            {/* Coins */}
            <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1.5 rounded-full hover:scale-105 transition-all cursor-pointer">
              <Coins className="w-4 h-4 text-[#f1c40f]" fill="#f1c40f" />
              <span className="font-bold text-sm">
                {isAuthenticated ? coinAmount.toLocaleString() : "0"}
              </span>
            </div>

            {isAuthenticated && user ? (
              <>
                <span className="hidden lg:block text-sm font-semibold text-slate-700">
                  Hello, {user.username}
                </span>

                {/* Avatar with Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="relative group cursor-pointer hover:scale-105 transition-transform"
                  >
                    <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 to-yellow-600 shadow-md">
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                        <User className="w-6 h-6 text-slate-400" />
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                      VIP
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                      <button
                        type="button"
                        onClick={() => handleNavigateAndClose("/profile")}
                        className="w-full px-4 py-2.5 text-left hover:bg-slate-100 text-slate-700 font-medium text-sm transition-colors flex items-center gap-3"
                      >
                        <User className="w-4 h-4 text-[#155ca5]" />
                        Profile
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleNavigateAndClose("/payment-history")
                        }
                        className="w-full px-4 py-2.5 text-left hover:bg-slate-100 text-slate-700 font-medium text-sm transition-colors flex items-center gap-3"
                      >
                        <History className="w-4 h-4 text-[#155ca5]" />
                        Lịch sử nạp
                      </button>
                      <hr className="my-1" />
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full px-4 py-2.5 text-left hover:bg-red-50 text-red-600 font-medium text-sm transition-colors flex items-center gap-3"
                      >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                disabled={loading}
                className="rounded-lg bg-[#155ca5] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#124e8b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Loading..." : "Login"}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around items-center py-3 z-50">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 ${isActive("/") ? "text-[#155ca5]" : "text-slate-400"}`}
        >
          <span className="text-xs font-bold">Learn</span>
        </Link>
        <Link
          to="/quests"
          className={`flex flex-col items-center gap-1 ${isActive("/quests") ? "text-[#155ca5]" : "text-slate-400"}`}
        >
          <span className="text-xs font-bold">Quests</span>
        </Link>
        <Link
          to="/leaderboard"
          className={`flex flex-col items-center gap-1 ${isActive("/leaderboard") ? "text-[#155ca5]" : "text-slate-400"}`}
        >
          <span className="text-xs font-bold">Ranks</span>
        </Link>
        <Link
          to="/shop"
          className={`flex flex-col items-center gap-1 ${isActive("/shop") ? "text-[#155ca5]" : "text-slate-400"}`}
        >
          <span className="text-xs font-bold">Shop</span>
        </Link>
        <Link
          to="/topup"
          className={`flex flex-col items-center gap-1 ${isActive("/topup") ? "text-[#155ca5]" : "text-slate-400"}`}
        >
          <span className="text-xs font-bold">Topup</span>
        </Link>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {isInventoryModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/35 px-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label="Your Items"
          onClick={() => setIsInventoryModalOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-[18px] bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.22)] sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between">
              <h2 className="text-xl font-extrabold tracking-tight text-slate-800 sm:text-2xl">
                🎒 Your Items
              </h2>
              <button
                type="button"
                onClick={() => setIsInventoryModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close inventory"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {inventoryItems.map((item) => {
                const hasUseApi =
                  item.useMode === "skip" && Boolean(item.userItemId);
                const isDisabled =
                  item.quantity <= 0 ||
                  usingItemId === item.id ||
                  isInventoryLoading ||
                  !hasUseApi;
                const isUsing = usingItemId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 rounded-2xl border px-3 py-3 transition-all duration-200 sm:px-4 ${
                      item.recommended
                        ? "border-amber-200 bg-amber-50/65 shadow-sm hover:-translate-y-0.5 hover:shadow-md"
                        : "border-slate-200 bg-slate-50/70 shadow-sm hover:-translate-y-0.5 hover:shadow-md"
                    }`}
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                      {item.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold text-slate-800 sm:text-base">
                          {item.name}
                        </p>
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-[#155ca5]">
                          x{item.quantity}
                        </span>
                        {item.recommended && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                        {item.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        void handleUseInventoryItem(item.id);
                      }}
                      disabled={isDisabled}
                      className="inline-flex min-w-[88px] items-center justify-center rounded-full bg-[#155ca5] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#124e8b] hover:shadow-md active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                    >
                      {isUsing ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
                          Using...
                        </span>
                      ) : isInventoryLoading ? (
                        "..."
                      ) : !hasUseApi ? (
                        "N/A"
                      ) : (
                        "Use"
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
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
