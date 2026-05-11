import { Link } from "react-router";
import { ArrowLeft, Home, ShieldAlert } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

export function Forbidden() {
  return (
    <div className="min-h-screen bg-[#f5f8fc] flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-rose-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(220,38,38,0.12),_transparent_40%),linear-gradient(135deg,rgba(255,247,247,0.96),rgba(255,255,255,0.92))]" />

          <div className="relative px-6 py-14 text-center sm:px-10">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-600/10 text-rose-600 shadow-inner">
              <ShieldAlert className="h-10 w-10" />
            </div>

            <div className="mx-auto max-w-xl space-y-4">
              <p className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-rose-700">
                403 Forbidden
              </p>
              <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                You do not have permission to access this page
              </h1>
              <p className="text-base leading-7 text-slate-600 sm:text-lg">
                This area is reserved for administrators or accounts with the
                appropriate permissions. Please return to the home page or
                contact an administrator if you think this is a mistake.
              </p>
            </div>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-700"
              >
                <Home className="h-4 w-4" />
                Go to home
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Go back
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
