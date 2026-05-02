const apiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  "http://localhost:8080/api";

function resolveBackendBaseUrl(apiUrl: string): string {
  if (apiUrl.endsWith("/api")) {
    return apiUrl.slice(0, -4);
  }

  return apiUrl;
}

export const ENV = {
  API_BASE_URL: apiBaseUrl,
  BACKEND_BASE_URL:
    (import.meta.env.VITE_BACKEND_BASE_URL as string | undefined) ||
    resolveBackendBaseUrl(apiBaseUrl),
};
