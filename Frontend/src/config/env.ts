const DEFAULT_API_BASE_URL = "/api";

function getDefaultOrigin(): string {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  return "http://localhost:8081";
}

const apiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  DEFAULT_API_BASE_URL;

function resolveBackendBaseUrl(apiUrl: string): string {
  if (!apiUrl || apiUrl.startsWith("/")) {
    return getDefaultOrigin();
  }

  if (apiUrl.endsWith("/api")) {
    return apiUrl.slice(0, -4);
  }

  try {
    return new URL(apiUrl).origin;
  } catch {
    return getDefaultOrigin();
  }
}

export const ENV = {
  API_BASE_URL: apiBaseUrl,
  BACKEND_BASE_URL:
    (import.meta.env.VITE_BACKEND_BASE_URL as string | undefined) ||
    resolveBackendBaseUrl(apiBaseUrl),
};
