import { Navigate, Outlet, useLocation } from "react-router";
import { useEffect, useState } from "react";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { PublicLanding } from "./pages/PublicLanding";
import { getMyShopItems } from "@/api/shop";
import { USER_BACKGROUND_CHANGED_EVENT } from "./utils/backgroundEvents";
import { BackgroundMusic } from "./components/BackgroundMusic";

export function Root() {
  const location = useLocation();
  const { isAuthenticated, isReady, user } = useAuth();
  const { copy } = useLanguage();
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(
    null,
  );

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

  useEffect(() => {
    if (!isReady || !isAuthenticated) {
      setBackgroundImageUrl(null);
      return;
    }

    let isMounted = true;

    const loadEquippedBackground = async () => {
      const response = await getMyShopItems();
      if (!isMounted) {
        return;
      }

      if (!response.success || !response.data) {
        setBackgroundImageUrl(null);
        return;
      }

      const equippedBackground = response.data.find(
        (item) => item.type === "BACKGROUND" && item.equipped,
      );
      setBackgroundImageUrl(equippedBackground?.imageUrl || null);
    };

    void loadEquippedBackground();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isReady, user?.id]);

  useEffect(() => {
    const handleBackgroundChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{ imageUrl?: string | null }>;
      setBackgroundImageUrl(customEvent.detail?.imageUrl || null);
    };

    window.addEventListener(
      USER_BACKGROUND_CHANGED_EVENT,
      handleBackgroundChanged,
    );

    return () => {
      window.removeEventListener(
        USER_BACKGROUND_CHANGED_EVENT,
        handleBackgroundChanged,
      );
    };
  }, []);

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
    <div
      className={`learner-tech-shell min-h-screen flex flex-col ${
        backgroundImageUrl ? "has-user-background" : ""
      }`}
    >
      <BackgroundMusic />
      <Navbar />
      <main
        className="learner-page-surface flex-1"
        style={
          backgroundImageUrl
            ? {
                backgroundImage: `linear-gradient(rgba(245,248,252,0.42), rgba(245,248,252,0.42)), url(${backgroundImageUrl})`,
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
              }
            : undefined
        }
      >
        <Outlet />
      </main>
      {!isFocusRoute && <Footer />}
    </div>
  );
}
