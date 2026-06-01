import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  DollarSign,
  ShoppingBag,
  LogOut,
  ChevronDown,
  User,
  Palette,
  Loader2,
  ClipboardCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Target,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { equipAvatar, equipBackground, getMyShopItems } from "@/api/shop";
import { USER_BACKGROUND_CHANGED_EVENT } from "@/app/utils/backgroundEvents";

const navigation = [
  { name: "User Management", href: "/admin/users", icon: Users },
  { name: "Content Management", href: "/admin/content", icon: FileText },
  { name: "Question Bank", href: "/admin/questions", icon: MessageSquare },
  {
    name: "Semester Tests",
    href: "/admin/semester-tests",
    icon: ClipboardCheck,
  },
  { name: "Payment Offers", href: "/admin/payments", icon: DollarSign },
  { name: "Shop Management", href: "/admin/shop", icon: ShoppingBag },
  { name: "Quests & Badges", href: "/admin/quests", icon: Target },
];

type CosmeticOption = {
  id: number;
  name: string;
  imageUrl: string;
  equipped: boolean;
};

const sortCosmeticOptions = (options: CosmeticOption[]): CosmeticOption[] =>
  [...options].sort((a, b) => {
    if (a.equipped !== b.equipped) {
      return a.equipped ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [loadingCosmetics, setLoadingCosmetics] = useState(false);
  const [savingCustomization, setSavingCustomization] = useState(false);
  const [customizationError, setCustomizationError] = useState<string | null>(
    null,
  );
  const [avatarOptions, setAvatarOptions] = useState<CosmeticOption[]>([]);
  const [backgroundOptions, setBackgroundOptions] = useState<CosmeticOption[]>(
    [],
  );
  const [selectedAvatarId, setSelectedAvatarId] = useState<number | null>(null);
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<
    number | null
  >(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(
    null,
  );
  const { user, logout, loading, refreshCurrentUser } = useAuth();
  const displayName = user?.username || user?.email || "Admin";
  const avatarUrl =
    typeof user?.avatar === "string" && user.avatar.length > 0
      ? user.avatar
      : undefined;
  const displayAvatarUrl = currentAvatarUrl || avatarUrl;
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  const loadAdminCosmetics = async (): Promise<void> => {
    setLoadingCosmetics(true);
    setCustomizationError(null);

    const response = await getMyShopItems();

    if (!response.success || !response.data) {
      setAvatarOptions([]);
      setBackgroundOptions([]);
      setBackgroundImageUrl(null);
      setCustomizationError(
        response.error?.message || "Unable to load profile cosmetics.",
      );
      setLoadingCosmetics(false);
      return;
    }

    const ownedItems = response.data;
    const nextAvatarOptions = sortCosmeticOptions(
      ownedItems
        .filter((item) => item.type === "AVATAR")
        .map((item) => ({
          id: item.shopItemId,
          name: item.name,
          imageUrl: item.imageUrl || "",
          equipped: item.equipped,
        })),
    );
    const nextBackgroundOptions = sortCosmeticOptions(
      ownedItems
        .filter((item) => item.type === "BACKGROUND")
        .map((item) => ({
          id: item.shopItemId,
          name: item.name,
          imageUrl: item.imageUrl || "",
          equipped: item.equipped,
        })),
    );
    const equippedAvatar = nextAvatarOptions.find((item) => item.equipped);
    const equippedBackground = nextBackgroundOptions.find(
      (item) => item.equipped,
    );

    setAvatarOptions(nextAvatarOptions);
    setBackgroundOptions(nextBackgroundOptions);
    setSelectedAvatarId(equippedAvatar?.id ?? null);
    setSelectedBackgroundId(equippedBackground?.id ?? null);
    setCurrentAvatarUrl(equippedAvatar?.imageUrl || null);
    setBackgroundImageUrl(equippedBackground?.imageUrl || null);
    setLoadingCosmetics(false);
  };

  useEffect(() => {
    void loadAdminCosmetics();
  }, [user?.id]);

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async (): Promise<void> => {
    setLogoutError(null);
    const isSuccess = await logout();

    if (!isSuccess) {
      setLogoutError("Unable to logout right now. Please try again.");
      return;
    }

    setIsUserMenuOpen(false);
  };

  const handleSwitchToUserView = (): void => {
    setIsUserMenuOpen(false);
    navigate("/");
  };

  const openCustomizeModal = (): void => {
    setCustomizationError(null);
    setSelectedAvatarId(
      avatarOptions.find((item) => item.equipped)?.id ?? null,
    );
    setSelectedBackgroundId(
      backgroundOptions.find((item) => item.equipped)?.id ?? null,
    );
    setIsUserMenuOpen(false);
    setIsCustomizeModalOpen(true);
  };

  const closeCustomizeModal = (): void => {
    if (savingCustomization) {
      return;
    }

    setCustomizationError(null);
    setIsCustomizeModalOpen(false);
  };

  const handleSaveCustomization = async (): Promise<void> => {
    const equippedAvatarId =
      avatarOptions.find((item) => item.equipped)?.id ?? null;
    const equippedBackgroundId =
      backgroundOptions.find((item) => item.equipped)?.id ?? null;
    const selectedAvatar = avatarOptions.find(
      (item) => item.id === selectedAvatarId,
    );
    const selectedBackground = backgroundOptions.find(
      (item) => item.id === selectedBackgroundId,
    );
    const avatarChanged =
      selectedAvatarId !== null && selectedAvatarId !== equippedAvatarId;
    const backgroundChanged =
      selectedBackgroundId !== null &&
      selectedBackgroundId !== equippedBackgroundId;

    if (!avatarChanged && !backgroundChanged) {
      setIsCustomizeModalOpen(false);
      return;
    }

    setSavingCustomization(true);
    setCustomizationError(null);

    try {
      if (avatarChanged) {
        const response = await equipAvatar(selectedAvatarId);
        if (!response.success) {
          setCustomizationError(
            response.error?.message || "Unable to equip avatar.",
          );
          return;
        }
      }

      if (backgroundChanged) {
        const response = await equipBackground(selectedBackgroundId);
        if (!response.success) {
          setCustomizationError(
            response.error?.message || "Unable to equip background.",
          );
          return;
        }
      }

      if (selectedAvatar?.imageUrl) {
        setCurrentAvatarUrl(selectedAvatar.imageUrl);
      }

      if (backgroundChanged) {
        const nextBackgroundUrl = selectedBackground?.imageUrl || null;
        setBackgroundImageUrl(nextBackgroundUrl);
        window.dispatchEvent(
          new CustomEvent(USER_BACKGROUND_CHANGED_EVENT, {
            detail: { imageUrl: nextBackgroundUrl },
          }),
        );
      }

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

      void refreshCurrentUser(false);
      setIsCustomizeModalOpen(false);
    } catch {
      setCustomizationError("Unable to save profile cosmetics.");
    } finally {
      setSavingCustomization(false);
    }
  };

  const sidebarWidthClass = isSidebarCollapsed ? "w-[92px]" : "w-[270px]";
  const contentOffsetClass = isSidebarCollapsed ? "ml-[92px]" : "ml-[270px]";
  const headerWidthClass = isSidebarCollapsed
    ? "w-[calc(100%-92px)]"
    : "w-[calc(100%-270px)]";

  return (
    <div
      className="min-h-screen bg-[#f7f9fc] flex"
      style={
        backgroundImageUrl
          ? {
              backgroundImage: `linear-gradient(rgba(247,249,252,0.62), rgba(247,249,252,0.62)), url(${backgroundImageUrl})`,
              backgroundAttachment: "fixed",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
            }
          : undefined
      }
    >
      {/* Sidebar */}
      <aside
        className={`${sidebarWidthClass} h-screen fixed left-0 top-0 bg-[#1a1a2e] shadow-xl flex flex-col z-50 overflow-y-auto transition-all duration-200`}
      >
        <div className={`${isSidebarCollapsed ? "px-4 py-6" : "px-6 py-8"}`}>
          <div
            className={`flex ${isSidebarCollapsed ? "justify-center" : "items-center gap-3"}`}
          >
            <div className="w-10 h-10 bg-[#8b0000] flex items-center justify-center rounded-lg shadow-inner">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            {!isSidebarCollapsed && (
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight uppercase">
                  UIFIVE
                </h1>
                <p className="text-[10px] text-slate-400 font-medium tracking-[0.2em] uppercase">
                  Admin Console
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            className={`mt-5 flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-300 transition hover:bg-white/10 hover:text-white ${isSidebarCollapsed ? "mx-auto justify-center" : "gap-2"}`}
            title={isSidebarCollapsed ? "Open sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
            {!isSidebarCollapsed && (
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                Collapse
              </span>
            )}
          </button>
        </div>

        <nav className={`flex-1 ${isSidebarCollapsed ? "mt-2" : "mt-4"}`}>
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                to={item.href}
                title={item.name}
                className={`flex items-center transition-colors cursor-pointer ${
                  isSidebarCollapsed
                    ? "justify-center px-4 py-3.5"
                    : "px-6 py-3.5"
                } ${
                  active
                    ? "border-l-4 border-red-600 bg-white/10 text-white"
                    : "text-slate-400 opacity-80 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon
                  className={
                    isSidebarCollapsed
                      ? ""
                      : `mr-4 ${active ? "opacity-100" : ""}`
                  }
                  size={20}
                />
                {!isSidebarCollapsed && (
                  <span className="font-inter text-[13px] font-medium tracking-wide uppercase">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className={`${isSidebarCollapsed ? "p-4" : "p-6"}`} />
      </aside>

      {/* Main Content */}
      <div
        className={`${contentOffsetClass} flex-1 flex flex-col transition-all duration-200`}
      >
        {/* Top Navigation */}
        <header
          className={`h-[60px] fixed top-0 right-0 ${headerWidthClass} flex justify-end items-center px-6 bg-white shadow-sm z-40 transition-all duration-200`}
        >
          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-6">
              <Link
                className="text-red-700 font-bold font-inter text-sm cursor-pointer"
                to="/admin"
              >
                Dashboard
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <div className="h-8 w-[1px] bg-slate-300 mx-1"></div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                    {displayAvatarUrl ? (
                      <img
                        src={displayAvatarUrl}
                        alt={`${displayName} avatar`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-slate-700">
                        {initials || "A"}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {displayName}
                  </span>
                  <ChevronDown
                    className={`text-slate-500 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`}
                    size={16}
                  />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-11 w-48 rounded-lg border border-slate-200 bg-white shadow-lg p-2">
                    <button
                      type="button"
                      onClick={handleSwitchToUserView}
                      className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <GraduationCap size={16} className="text-[#155ca5]" />
                      User View
                    </button>
                    <button
                      type="button"
                      onClick={openCustomizeModal}
                      className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <User size={16} className="text-[#155ca5]" />
                      Profile
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loading}
                      className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <LogOut size={16} className="text-red-600" />
                      {loading ? "Logging out..." : "Logout"}
                    </button>
                  </div>
                )}
              </div>

              {logoutError && (
                <span className="text-xs font-medium text-red-600">
                  {logoutError}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="mt-[60px] p-6 min-h-[calc(100vh-60px)]">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="py-3 flex justify-between items-center px-6 bg-slate-50 border-t border-slate-100">
          <p className="text-[11px] font-medium text-slate-400">
            UIFIVE Admin Panel v2.4.0
          </p>
          <div className="flex gap-4">
            <a
              className="text-[11px] font-medium text-slate-400 hover:text-red-500"
              href="#"
            >
              Support
            </a>
            <a
              className="text-[11px] font-medium text-slate-400 hover:text-red-500"
              href="#"
            >
              Privacy Policy
            </a>
          </div>
        </footer>
      </div>

      {isCustomizeModalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4 py-6"
          onClick={closeCustomizeModal}
        >
          <div
            className="w-full max-w-3xl max-h-[86vh] overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="flex items-center gap-2 text-xl font-black text-slate-900">
                <Palette className="h-5 w-5 text-[#155ca5]" />
                Profile
              </h2>
              {loadingCosmetics && (
                <Loader2 className="h-5 w-5 animate-spin text-[#155ca5]" />
              )}
            </div>

            <div className="space-y-6">
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">
                    Avatar
                  </h3>
                  <span className="text-xs font-semibold text-slate-500">
                    {avatarOptions.length} owned
                  </span>
                </div>
                {avatarOptions.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                    {avatarOptions.map((item) => {
                      const isSelected = selectedAvatarId === item.id;

                      return (
                        <button
                          key={`admin-avatar-${item.id}`}
                          type="button"
                          onClick={() => setSelectedAvatarId(item.id)}
                          className={`rounded-lg border p-2 text-left transition ${
                            isSelected
                              ? "border-[#155ca5] bg-[#155ca5]/5 ring-2 ring-[#155ca5]/20"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="aspect-square overflow-hidden rounded-md bg-slate-100">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="grid h-full w-full place-items-center text-xs text-slate-500">
                                No Image
                              </div>
                            )}
                          </div>
                          <p className="mt-2 truncate text-xs font-bold text-slate-800">
                            {item.name}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 p-5 text-sm font-semibold text-slate-500">
                    No owned avatars.
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">
                    Background
                  </h3>
                  <span className="text-xs font-semibold text-slate-500">
                    {backgroundOptions.length} owned
                  </span>
                </div>
                {backgroundOptions.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {backgroundOptions.map((item) => {
                      const isSelected = selectedBackgroundId === item.id;

                      return (
                        <button
                          key={`admin-background-${item.id}`}
                          type="button"
                          onClick={() => setSelectedBackgroundId(item.id)}
                          className={`rounded-lg border p-2 text-left transition ${
                            isSelected
                              ? "border-[#155ca5] bg-[#155ca5]/5 ring-2 ring-[#155ca5]/20"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="h-24 overflow-hidden rounded-md bg-slate-100">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="grid h-full w-full place-items-center text-xs text-slate-500">
                                No Image
                              </div>
                            )}
                          </div>
                          <p className="mt-2 truncate text-xs font-bold text-slate-800">
                            {item.name}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 p-5 text-sm font-semibold text-slate-500">
                    No owned backgrounds.
                  </div>
                )}
              </section>
            </div>

            {customizationError && (
              <p className="mt-4 text-sm font-semibold text-red-600">
                {customizationError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeCustomizeModal}
                disabled={savingCustomization}
                className="rounded-md bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomization}
                disabled={savingCustomization || loadingCosmetics}
                className="rounded-md bg-[#155ca5] px-4 py-2 text-sm font-bold text-white hover:brightness-105 disabled:opacity-60"
              >
                {savingCustomization ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
