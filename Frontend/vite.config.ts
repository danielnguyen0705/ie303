import { defineConfig, loadEnv } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const backendTarget =
    env.VITE_BACKEND_BASE_URL?.trim() || "http://localhost:8080";

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: "0.0.0.0",
      proxy: {
        "/api": {
          target: backendTarget,
          changeOrigin: true,
        },
        "/oauth2/authorization": {
          target: backendTarget,
          changeOrigin: true,
        },
        "/login/oauth2": {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    preview: {
      host: "0.0.0.0",
      allowedHosts: true,
    },
  };
});
