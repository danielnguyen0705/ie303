import { Link, useLocation, useNavigate } from "react-router";
import { Flame, Coins, User, LogOut, History } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/context/AuthContext";

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
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

  const handleLogout = async () => {
    await logout();
    setIsDropdownOpen(false);
    navigate("/");
  };

  const handleNavigateAndClose = (path: string) => {
    navigate(path);
    setIsDropdownOpen(false);
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
    </>
  );
}
