import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const viteCli = path.resolve(__dirname, "../node_modules/vite/bin/vite.js");
const port = process.env.PORT ?? "4173";

const child = spawn(process.execPath, [viteCli, "preview", "--host", "0.0.0.0", "--port", port], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
