import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getGoogleOAuth2AuthorizeUrl,
  login as loginApi,
  logout as logoutApi,
  register as registerApi,
} from "@/api/auth";

import { getCurrentUser } from "@/api/users";
import { clearCache } from "@/api/utils/cache";

const AUTH_USER_STORAGE_KEY = "uifive-auth-user";

function buildDefaultAvatar(seed: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

type AuthUser = {
  id?: string;
  username: string;
  email?: string;
  avatar?: string;
  role?: string;
  [key: string]: unknown;
};

type RegisterResult = {
  success: boolean;
  requiresEmailVerification?: boolean;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isReady: boolean;
  error: string | null;
  isAuthenticated: boolean;
  refreshCurrentUser: (showError?: boolean) => Promise<boolean>;
  login: (username: string, password: string) => Promise<boolean>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<RegisterResult>;
  loginWithGoogle: () => void;
  logout: () => Promise<boolean>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const candidate = parsed as Record<string, unknown>;
    if (typeof candidate.username !== "string") {
      return null;
    }

    return candidate as AuthUser;
  } catch {
    return null;
  }
}

function storeUser(user: AuthUser | null): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (user) {
      window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    }
  } catch {
    // Ignore storage failures and keep auth working in memory.
  }
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }

  return "Authentication failed. Please try again.";
}

function extractUser(payload: unknown): AuthUser | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const data = payload as Record<string, unknown>;
  const candidateSources = [data.result, data.data, data.user, data];

  for (const source of candidateSources) {
    if (!source || typeof source !== "object") {
      continue;
    }

    const candidate = source as Record<string, unknown>;

    if (
      typeof candidate.username === "string" ||
      typeof candidate.name === "string"
    ) {
      const username =
        (candidate.username as string | undefined) ||
        (candidate.name as string);

      return {
        ...candidate,
        username,
        avatar:
          typeof candidate.avatar === "string" && candidate.avatar.length > 0
            ? candidate.avatar
            : buildDefaultAvatar(username),
      } as AuthUser;
    }
  }

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initialStoredUser] = useState<AuthUser | null>(() => readStoredUser());
  const [user, setUser] = useState<AuthUser | null>(() => initialStoredUser);
  const [loading, setLoading] = useState<boolean>(() => !initialStoredUser);
  const [isReady, setIsReady] = useState<boolean>(Boolean(initialStoredUser));
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = Boolean(user);

  const loadCurrentUser = useCallback(
    async (
      showError: boolean = true,
      options?: { setLoading?: boolean; preserveExistingUser?: boolean },
    ): Promise<boolean> => {
      const shouldSetLoading = options?.setLoading ?? true;
      const preserveExistingUser = options?.preserveExistingUser ?? false;

      if (shouldSetLoading) {
        setLoading(true);
      }

      if (showError) {
        setError(null);
      }

      const response = await getCurrentUser();

      if (response.success && response.data) {
        const resolvedUser = extractUser(response.data);

        if (resolvedUser) {
          setUser(resolvedUser);
          storeUser(resolvedUser);
          if (shouldSetLoading) {
            setLoading(false);
          }
          return true;
        } else {
          if (!preserveExistingUser) {
            setUser(null);
            storeUser(null);
          }
          if (showError) {
            setError("Unable to resolve user profile.");
          }
        }
      } else {
        if (!preserveExistingUser) {
          setUser(null);
          storeUser(null);
        }
        if (showError) {
          setError(
            response.error?.message ?? "Session expired. Please log in again.",
          );
        }
      }

      if (shouldSetLoading) {
        setLoading(false);
      }
      return false;
    },
    [],
  );

  useEffect(() => {
    void loadCurrentUser(false, {
      setLoading: false,
      preserveExistingUser: Boolean(initialStoredUser),
    }).finally(() => {
      setLoading(false);
      setIsReady(true);
    });
  }, [initialStoredUser, loadCurrentUser]);

  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await loginApi({ username, password });

        if (!response.success) {
          setError(response.error?.message ?? "Login failed.");
          return false;
        }

        clearCache();
        const success = await loadCurrentUser(true);
        if (success) {
          return true;
        }

        return false;
      } catch (unknownError: unknown) {
        setError(getErrorMessage(unknownError));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [loadCurrentUser],
  );

  const register = useCallback(
    async (
      username: string,
      email: string,
      password: string,
    ): Promise<RegisterResult> => {
      setLoading(true);
      setError(null);

      try {
        const response = await registerApi({
          username: username,
          email,
          password,
        });

        if (!response.success) {
          setError(response.error?.message ?? "Registration failed.");
          return { success: false };
        }

        setUser(null);
        storeUser(null);
        setError(null);

        return {
          success: true,
          requiresEmailVerification: true,
        };
      } catch (unknownError: unknown) {
        setError(getErrorMessage(unknownError));
        return { success: false };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await logoutApi();

      if (!response.success) {
        setError(response.error?.message ?? "Logout failed.");
        return false;
      }

      setUser(null);
      storeUser(null);
      clearCache();
      return true;
    } catch (unknownError: unknown) {
      setError(getErrorMessage(unknownError));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback((): void => {
    setError(null);
    window.location.href = getGoogleOAuth2AuthorizeUrl();
  }, []);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isReady,
      error,
      isAuthenticated,
      refreshCurrentUser: loadCurrentUser,
      login,
      register,
      loginWithGoogle,
      logout,
      clearError,
    }),
    [
      user,
      loading,
      isReady,
      error,
      isAuthenticated,
      loadCurrentUser,
      login,
      register,
      loginWithGoogle,
      logout,
      clearError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
