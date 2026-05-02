import { Link, Outlet, useLocation } from "react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  BarChart3,
  Crown,
  DollarSign,
  Bell,
  Settings,
  ShoppingBag,
  Search,
  HelpCircle,
  LogOut,
  ChevronDown,
  BookOpen,
  Layers3,
  ClipboardCheck,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "User Management", href: "/admin/users", icon: Users },
  { name: "Content Management", href: "/admin/content", icon: FileText },
  { name: "Question Bank", href: "/admin/questions", icon: MessageSquare },
  { name: "Unit Reviews", href: "/admin/unit-reviews", icon: BookOpen },
  { name: "Group Reviews", href: "/admin/group-reviews", icon: Layers3 },
  { name: "Semester Tests", href: "/admin/semester-tests", icon: ClipboardCheck },
  { name: "Reports", href: "/admin/reports", icon: BarChart3 },
  { name: "VIP Management", href: "/admin/vip", icon: Crown },
  { name: "Payment Offers", href: "/admin/payments", icon: DollarSign },
  { name: "Shop Management", href: "/admin/shop", icon: ShoppingBag },
  { name: "Notifications", href: "/admin/notifications", icon: Bell },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminLayout() {
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const { logout, loading } = useAuth();

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

  const sidebarWidthClass = isSidebarCollapsed ? "w-[92px]" : "w-[270px]";
  const contentOffsetClass = isSidebarCollapsed ? "ml-[92px]" : "ml-[270px]";
  const headerWidthClass = isSidebarCollapsed
    ? "w-[calc(100%-92px)]"
    : "w-[calc(100%-270px)]";

  return (
    <div className="min-h-screen bg-[#f7f9fc] flex">
      {/* Sidebar */}
      <aside className={`${sidebarWidthClass} h-screen fixed left-0 top-0 bg-[#1a1a2e] shadow-xl flex flex-col z-50 overflow-y-auto transition-all duration-200`}>
        <div className={`${isSidebarCollapsed ? "px-4 py-6" : "px-6 py-8"}`}>
          <div className={`flex ${isSidebarCollapsed ? "justify-center" : "items-center gap-3"}`}>
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
            title={isSidebarCollapsed ? "Mở sidebar" : "Thu gọn sidebar"}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
            {!isSidebarCollapsed && (
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                Thu gọn
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
                  className={isSidebarCollapsed ? "" : `mr-4 ${active ? "opacity-100" : ""}`}
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

        <div className={`${isSidebarCollapsed ? "p-4" : "p-6"}`}>
          <div className="bg-white/5 rounded-lg p-4">
            {!isSidebarCollapsed && (
              <>
                <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-2">
                  System Load
                </p>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#b02d21] h-full w-[42%]"></div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  v2.4.0 Stable Build
                </p>
              </>
            )}
            {isSidebarCollapsed && (
              <div className="flex justify-center">
                <div className="h-9 w-9 rounded-full bg-[#b02d21]/20 flex items-center justify-center">
                  <BarChart3 size={16} className="text-[#ff8f84]" />
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`${contentOffsetClass} flex-1 flex flex-col transition-all duration-200`}>
        {/* Top Navigation */}
        <header className={`h-[60px] fixed top-0 right-0 ${headerWidthClass} flex justify-between items-center px-6 bg-white shadow-sm z-40 transition-all duration-200`}>
          <div className="flex items-center flex-1">
            <div className="relative w-full max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                className="w-full bg-[#f2f4f7] border-none rounded-md pl-10 pr-4 py-1.5 text-sm focus:ring-1 ring-red-500 font-inter"
                placeholder="Search analytics or students..."
                type="text"
              />
            </div>
          </div>
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
              <HelpCircle
                className="text-slate-500 hover:text-red-600 cursor-pointer"
                size={20}
              />
              <Settings
                className="text-slate-500 hover:text-red-600 cursor-pointer"
                size={20}
              />
              <div className="h-8 w-[1px] bg-slate-300 mx-1"></div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                    <span className="text-sm font-bold text-slate-700">AD</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    Admin.UI
                  </span>
                  <ChevronDown
                    className={`text-slate-500 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`}
                    size={16}
                  />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-11 w-44 rounded-lg border border-slate-200 bg-white shadow-lg p-2">
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
    </div>
  );
}
