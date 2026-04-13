import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/context/AuthContext";

export function RequireAuth() {
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
    return <Navigate to="/" replace />;
  }

  if (user?.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default RequireAuth;
