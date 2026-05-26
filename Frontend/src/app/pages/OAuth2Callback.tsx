import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { clearCache } from "@/api/utils/cache";

function getSafeRedirectTarget(value: string | null): string {
  if (!value) {
    return "/";
  }

  return value.startsWith("/") ? value : "/";
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function OAuth2Callback() {
  const { copy } = useLanguage();
  const { refreshCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const status = searchParams.get("status");
      const target = getSafeRedirectTarget(searchParams.get("returnTo"));

      clearCache();

      if (status && status !== "success") {
        setState("error");
        setMessage(
          searchParams.get("error") ||
            copy("Google login failed. Please try again.", "Dang nhap Google that bai. Vui long thu lai."),
        );
        return;
      }

      for (let attempt = 0; attempt < 4; attempt += 1) {
        const success = await refreshCurrentUser(false);
        if (success) {
          setState("success");
          navigate(target, { replace: true });
          return;
        }

        if (attempt < 3) {
          await delay(300);
        }
      }

      setState("error");
      setMessage(
        copy(
          "Login succeeded but the session could not be restored. Please try again.",
          "Dang nhap thanh cong nhung khong khoi tao duoc phien dang nhap. Vui long thu lai.",
        ),
      );
    };

    void run();
  }, [copy, navigate, refreshCurrentUser, searchParams]);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-6 py-10">
      <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
        {state === "loading" && (
          <div className="space-y-4">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#155ca5]" />
            <h1 className="text-2xl font-black text-[#1e2e51]">
              {copy("Signing you in...", "Dang dang nhap...")}
            </h1>
            <p className="text-slate-600">
              {copy(
                "Please wait while we finish connecting your Google account.",
                "Vui long cho trong giay lat de hoan tat ket noi voi tai khoan Google.",
              )}
            </p>
          </div>
        )}

        {state === "success" && (
          <div className="space-y-4">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <h1 className="text-2xl font-black text-[#1e2e51]">
              {copy("Login successful", "Dang nhap thanh cong")}
            </h1>
            <p className="text-slate-600">
              {copy("Redirecting to your dashboard...", "Dang chuyen ve trang chinh...")}
            </p>
          </div>
        )}

        {state === "error" && (
          <div className="space-y-4">
            <XCircle className="mx-auto h-12 w-12 text-red-600" />
            <h1 className="text-2xl font-black text-[#1e2e51]">
              {copy("Login could not be completed", "Khong the hoan tat dang nhap")}
            </h1>
            <p className="text-slate-600">{message}</p>
            <button
              type="button"
              onClick={() => navigate("/", { replace: true })}
              className="rounded-full bg-[#155ca5] px-5 py-2.5 font-black text-white transition hover:bg-[#0f4c88]"
            >
              {copy("Go to dashboard", "Ve trang chinh")}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
