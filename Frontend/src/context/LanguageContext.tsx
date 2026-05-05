import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";

export type AppLanguage = "en" | "vi";

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  toggleLanguage: () => void;
  isVietnamese: boolean;
  copy: (english: string, vietnamese: string) => string;
};

const STORAGE_KEY = "uifive-language";

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [preferredLanguage, setPreferredLanguage] = useState<AppLanguage>("en");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "vi") {
        setPreferredLanguage(stored);
      }
    } catch {
      // ignore storage issues
    }
  }, []);

  const effectiveLanguage: AppLanguage =
    user?.role === "ADMIN" ? "en" : preferredLanguage;

  const value = useMemo<LanguageContextValue>(
    () => ({
      language: effectiveLanguage,
      setLanguage: (language) => {
        if (user?.role === "ADMIN") return;
        setPreferredLanguage(language);
        try {
          window.localStorage.setItem(STORAGE_KEY, language);
        } catch {
          // ignore storage issues
        }
      },
      toggleLanguage: () => {
        if (user?.role === "ADMIN") return;
        const nextLanguage = preferredLanguage === "en" ? "vi" : "en";
        setPreferredLanguage(nextLanguage);
        try {
          window.localStorage.setItem(STORAGE_KEY, nextLanguage);
        } catch {
          // ignore storage issues
        }
      },
      isVietnamese: effectiveLanguage === "vi",
      copy: (english, vietnamese) =>
        effectiveLanguage === "vi" ? vietnamese : english,
    }),
    [effectiveLanguage, preferredLanguage, user?.role],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
