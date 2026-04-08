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
  getCurrentUser,
  login as loginApi,
  logout as logoutApi,
  register as registerApi,
} from "@/api/auth";

type AuthUser = {
  id?: string;
  username: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<boolean>;
  logout: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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
      return {
        ...candidate,
        username:
          (candidate.username as string | undefined) ||
          (candidate.name as string),
      } as AuthUser;
    }
  }

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = Boolean(user);

  const loadCurrentUser = useCallback(
    async (showError: boolean = true): Promise<boolean> => {
      setLoading(true);
      if (showError) {
        setError(null);
      }

      const response = await getCurrentUser();

      if (response.success && response.data) {
        const resolvedUser = extractUser(response.data);

        if (resolvedUser) {
          setUser(resolvedUser);
          setLoading(false);
          return true;
        } else {
          setUser(null);
          if (showError) {
            setError("Unable to resolve user profile.");
          }
        }
      } else {
        setUser(null);
        if (showError) {
          setError(
            response.error?.message ?? "Session expired. Please log in again.",
          );
        }
      }

      setLoading(false);
      return false;
    },
    [],
  );

  useEffect(() => {
    void loadCurrentUser(false);
  }, [loadCurrentUser]);

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

        return await loadCurrentUser(true);
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
    ): Promise<boolean> => {
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
          return false;
        }

        return await loadCurrentUser(true);
      } catch (unknownError: unknown) {
        setError(getErrorMessage(unknownError));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [loadCurrentUser],
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
      return true;
    } catch (unknownError: unknown) {
      setError(getErrorMessage(unknownError));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      isAuthenticated,
      login,
      register,
      logout,
    }),
    [user, loading, error, isAuthenticated, login, register, logout],
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
