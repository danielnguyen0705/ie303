import { Navigate, Outlet, useLocation } from "react-router";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { PublicLanding } from "./pages/PublicLanding";

export function Root() {
  const location = useLocation();
  const { isAuthenticated, isReady, user } = useAuth();
  const { copy } = useLanguage();

  const adminAllowedLearnerPaths = [
    "/lessons/",
    "/reviews/",
    "/tests/semester",
    "/test/review",
    "/test/revision",
  ];

  const canAdminAccessLearnerPath = adminAllowedLearnerPaths.some((path) =>
    location.pathname.startsWith(path),
  );
  const focusRoutes = [
    "/grades/",
    "/units/",
    "/sections/",
    "/lessons/",
    "/reviews/",
    "/tests/semester",
    "/test/review",
    "/test/revision",
    "/exercise/",
  ];
  const isFocusRoute = focusRoutes.some((path) =>
    location.pathname.startsWith(path),
  );

  if (!isReady) {
    return (
      <div className="learner-tech-shell flex min-h-screen items-center justify-center">
        <div className="rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-[#155ca5] shadow-sm">
          {copy("Loading...", "Đang tải...")}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PublicLanding />;
  }

  if (user?.role === "ADMIN" && !canAdminAccessLearnerPath) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="learner-tech-shell min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      {!isFocusRoute && <Footer />}
    </div>
  );
}
