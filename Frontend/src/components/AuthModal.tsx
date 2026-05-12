import { useMemo, useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess?: () => void;
};

type AuthMode = "login" | "register";

export default function AuthModal({
  isOpen,
  onClose,
  onRegisterSuccess,
}: AuthModalProps) {
  const { login, register, loginWithGoogle, loading, error } = useAuth();
  const { copy } = useLanguage();

  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [visible, setVisible] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const switchTimeoutRef = useRef<number | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const title = useMemo(
    () =>
      mode === "login"
        ? copy("Welcome back", "Chào mừng quay lại")
        : copy("Create your account", "Tạo tài khoản"),
    [copy, mode],
  );

  const resetForm = (): void => {
    setUsername("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setFormError(null);
  };

  useEffect(() => {
    if (isOpen) {
      setVisible(false);
      requestAnimationFrame(() => setVisible(true));
      resetForm();
    } else {
      setVisible(false);
    }

    return () => {
      if (switchTimeoutRef.current) {
        window.clearTimeout(switchTimeoutRef.current);
        switchTimeoutRef.current = null;
      }
    };
  }, [isOpen]);

  const switchMode = (nextMode: AuthMode): void => {
    if (nextMode === mode) return;

    setTabVisible(false);

    if (switchTimeoutRef.current) {
      window.clearTimeout(switchTimeoutRef.current);
    }

    switchTimeoutRef.current = window.setTimeout(() => {
      resetForm();
      setMode(nextMode);
      setTabVisible(true);
      switchTimeoutRef.current = null;
    }, 160);
  };

  if (!isOpen) {
    return null;
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-[#155ca5] focus:ring-2 focus:ring-[#155ca5]/20 focus:shadow-[0_0_0_4px_rgba(21,92,165,0.12)]";
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!username.trim() || !password.trim()) {
      setFormError(
        copy(
          "Username and password are required.",
          "Tên đăng nhập và mật khẩu là bắt buộc.",
        ),
      );
      return;
    }

    if (mode === "register") {
      if (!email.trim()) {
        setFormError(copy("Email is required.", "Email là bắt buộc."));
        return;
      }

      const registerResult = await register(
        username.trim(),
        email.trim(),
        password,
      );

      if (registerResult.success) {
        resetForm();
        onClose();

        if (registerResult.requiresEmailVerification) {
          window.setTimeout(() => {
            onRegisterSuccess?.();
          }, 0);
        }

        switchMode("login");
      }

      return;
    }

    const isSuccess = await login(username.trim(), password);

    if (isSuccess) {
      resetForm();
      onClose();
    }
  };

  return (
    <div
      onMouseDown={(e) => {
        if (
          contentRef.current &&
          !contentRef.current.contains(e.target as Node)
        ) {
          onClose();
        }
      }}
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-slate-950/45 p-4 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`w-full max-w-md rounded-[1.35rem] bg-gradient-to-br from-blue-500/45 via-cyan-400/25 to-white/10 p-[1px] shadow-2xl shadow-slate-950/30 transition-all duration-300 ease-out ${
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-4 scale-95 opacity-0"
        }`}
      >
        <div
          ref={contentRef}
          className="rounded-[1.3rem] bg-white/95 p-6 shadow-xl backdrop-blur-xl"
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-950">
                {title}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {mode === "login"
                  ? copy(
                      "Sign in to continue your learning journey.",
                      "Đăng nhập để tiếp tục hành trình học tập của bạn.",
                    )
                  : copy(
                      "Join UIFIVE and start learning today.",
                      "Tham gia UIFIVE và bắt đầu học ngay hôm nay.",
                    )}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2.5 py-1.5 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 active:scale-95"
              aria-label={copy("Close auth modal", "Đóng hộp thoại đăng nhập")}
            >
              X
            </button>
          </div>

          <div className="relative mb-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
            <div
              className={`absolute bottom-1 top-1 w-[calc(50%-0.25rem)] rounded-lg bg-white shadow-sm transition-all duration-300 ease-out ${
                mode === "login" ? "left-1" : "left-1/2"
              }`}
            />

            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`relative z-10 rounded-lg px-3 py-2 transition-colors duration-200 ${
                mode === "login"
                  ? "text-slate-950"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {copy("Login", "Đăng nhập")}
            </button>

            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`relative z-10 rounded-lg px-3 py-2 transition-colors duration-200 ${
                mode === "register"
                  ? "text-slate-950"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {copy("Register", "Đăng ký")}
            </button>
          </div>

          <div
            className={`transition-all duration-200 ${
              tabVisible
                ? "translate-y-0 opacity-100"
                : "-translate-y-2 opacity-0"
            }`}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="auth-username"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  {copy("Username", "Tên đăng nhập")}
                </label>
                <input
                  id="auth-username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className={inputClass}
                  placeholder={copy(
                    "Enter your username",
                    "Nhập tên đăng nhập",
                  )}
                  autoComplete="username"
                />
              </div>

              {mode === "register" && (
                <div>
                  <label
                    htmlFor="auth-email"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Email
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={inputClass}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              )}

              <label
                htmlFor="auth-password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                {copy("Password", "Mật khẩu")}
              </label>

              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={`${inputClass} pr-10`}
                  placeholder={copy("Enter your password", "Nhập mật khẩu")}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-2 flex items-center rounded p-1 text-slate-500 hover:text-slate-700"
                  aria-label={
                    showPassword
                      ? copy("Hide password", "Ẩn mật khẩu")
                      : copy("Show password", "Hiện mật khẩu")
                  }
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-7-11-7a18.64 18.64 0 012.223-3.106M6.6 6.6A9.953 9.953 0 0112 5c7 0 11 7 11 7a18.56 18.56 0 01-2.36 3.27M3 3l18 18"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c7 0 11 7 11 7s-1.997 3.577-5.08 5.486M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {(formError || error) && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 shadow-sm">
                  {formError || error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#155ca5] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#124e8b] hover:shadow-blue-500/40 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
              >
                {loading
                  ? mode === "login"
                    ? copy("Signing in...", "Đang đăng nhập...")
                    : copy("Creating account...", "Đang tạo tài khoản...")
                  : mode === "login"
                    ? copy("Login", "Đăng nhập")
                    : copy("Register", "Đăng ký")}
              </button>

              {mode === "login" && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-slate-500">
                        {copy("or", "hoặc")}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={loginWithGoogle}
                    disabled={loading}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5 transition-transform duration-200 group-hover:rotate-6 group-hover:scale-110"
                      viewBox="0 0 48 48"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M43.61 20.08H42V20H24v8h11.3C33.65 32.66 29.28 36 24 36c-6.63 0-12-5.37-12-12s5.37-12 12-12c3.06 0 5.84 1.15 7.96 3.04l5.66-5.66C34.05 6.05 29.27 4 24 4 12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20c0-1.34-.14-2.65-.39-3.92z"
                        fill="#FFC107"
                      />
                      <path
                        d="M6.31 14.69l6.57 4.82C14.66 15.09 18.96 12 24 12c3.06 0 5.84 1.15 7.96 3.04l5.66-5.66C34.05 6.05 29.27 4 24 4c-7.68 0-14.33 4.34-17.69 10.69z"
                        fill="#FF3D00"
                      />
                      <path
                        d="M24 44c5.17 0 9.86-1.98 13.41-5.2l-6.19-5.24C29.14 35.09 26.7 36 24 36c-5.26 0-9.62-3.32-11.29-7.95l-6.52 5.02C9.49 39.56 16.22 44 24 44z"
                        fill="#4CAF50"
                      />
                      <path
                        d="M43.61 20.08H42V20H24v8h11.3c-.8 2.27-2.26 4.21-4.08 5.56l.01-.01 6.19 5.24C37 39.14 44 34 44 24c0-1.34-.14-2.65-.39-3.92z"
                        fill="#1976D2"
                      />
                    </svg>
                    <span>
                      {copy("Continue with Google", "Tiếp tục với Google")}
                    </span>
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
