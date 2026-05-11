import { Link, useLocation } from "react-router";
import { ArrowLeft, Home, SearchX, Sparkles } from "lucide-react";

export function NotFound() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith("/admin");
  const primaryHref = isAdminPath ? "/admin" : "/";
  const primaryLabel = isAdminPath ? "Go to admin dashboard" : "Go to home";

  return (
    <main className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(21,92,165,0.12),_transparent_40%),linear-gradient(135deg,rgba(248,250,252,0.9),rgba(239,246,255,0.8))]" />

        <div className="relative px-6 py-14 text-center sm:px-10">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#155ca5]/10 text-[#155ca5] shadow-inner">
            <SearchX className="h-10 w-10" />
          </div>

          <div className="mx-auto max-w-xl space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#bfd8ff] bg-[#eef6ff] px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[#155ca5]">
              <Sparkles className="h-3.5 w-3.5" />
              Page not found
            </p>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              404
            </h1>
            <p className="text-base leading-7 text-slate-600 sm:text-lg">
              The page you requested does not exist or has moved. Check the URL
              or head back to a valid section of UIFIVE.
            </p>
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to={primaryHref}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#155ca5] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#155ca5]/20 transition hover:bg-[#124d8c]"
            >
              {isAdminPath ? (
                <Home className="h-4 w-4" />
              ) : (
                <Home className="h-4 w-4" />
              )}
              {primaryLabel}
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
