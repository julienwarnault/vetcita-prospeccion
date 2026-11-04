import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/postcss";

// Keep tool state in the project without changing the host's settings.
process.env.CLOUDFLARE_CF_FETCH_ENABLED ??= "false";
process.env.WRANGLER_SEND_METRICS ??= "false";
process.env.WRANGLER_WRITE_LOGS ??= "false";
process.env.WRANGLER_LOG_PATH ??= `${process.cwd()}/.wrangler/logs`;
process.env.WRANGLER_REGISTRY_PATH ??= `${process.cwd()}/.wrangler/dev-registry`;
process.env.MINIFLARE_REGISTRY_PATH ??= `${process.cwd()}/.wrangler/registry`;
const { cloudflare } = await import("@cloudflare/vite-plugin");

export default defineConfig({
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [
    react(),
    cloudflare({
      inspectorPort: false,
      persistState: { path: ".wrangler/state" },
    }),
  ],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    ...(process.env.CODEX_SANDBOX === "seatbelt"
      ? { watch: { useFsEvents: false, usePolling: true } }
      : {}),
  },
});
