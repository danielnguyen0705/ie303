import { Navigate, Outlet } from "react-router";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { useAuth } from "@/context/AuthContext";
import { PublicLanding } from "./pages/PublicLanding";

export function Root() {
  const { isAuthenticated, isReady, user } = useAuth();

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f6ff]">
        <div className="rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-[#155ca5] shadow-sm">
          Loading...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PublicLanding />;
  }

  if (user?.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-[#f5f8fc] flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
