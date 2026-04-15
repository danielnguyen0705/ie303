import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type AuthMode = "login" | "register";

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, register, loginWithGoogle, loading, error } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  const title = useMemo(
    () => (mode === "login" ? "Welcome back" : "Create your account"),
    [mode],
  );

  if (!isOpen) {
    return null;
  }

  const resetForm = (): void => {
    setUsername("");
    setEmail("");
    setPassword("");
    setFormError(null);
  };

  const switchMode = (nextMode: AuthMode): void => {
    setMode(nextMode);
    setFormError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!username.trim() || !password.trim()) {
      setFormError("Username and password are required.");
      return;
    }

    let isSuccess = false;

    if (mode === "register") {
      if (!email.trim()) {
        setFormError("Email is required.");
        return;
      }

      isSuccess = await register(username.trim(), email.trim(), password);
    } else {
      isSuccess = await login(username.trim(), password);
    }

    if (isSuccess) {
      resetForm();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === "login"
                ? "Sign in to continue your learning journey."
                : "Join UIFIVE and start learning today."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close auth modal"
          >
            X
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`rounded-md px-3 py-2 transition ${
              mode === "login"
                ? "bg-white text-slate-900 shadow"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className={`rounded-md px-3 py-2 transition ${
              mode === "register"
                ? "bg-white text-slate-900 shadow"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="auth-username"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Username
            </label>
            <input
              id="auth-username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#155ca5] focus:ring-2 focus:ring-[#155ca5]/20"
              placeholder="Enter your username"
              autoComplete="username"
            />
          </div>

          {mode === "register" && (
            <div>
              <label
                htmlFor="auth-email"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#155ca5] focus:ring-2 focus:ring-[#155ca5]/20"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="auth-password"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#155ca5] focus:ring-2 focus:ring-[#155ca5]/20"
              placeholder="Enter your password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
          </div>

          {(formError || error) && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError || error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#155ca5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#124e8b] disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading
              ? mode === "login"
                ? "Signing in..."
                : "Creating account..."
              : mode === "login"
                ? "Login"
                : "Register"}
          </button>

          {mode === "login" && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={loginWithGoogle}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
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
                <span>Continue with Google</span>
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
