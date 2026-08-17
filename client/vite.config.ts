import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const BACKEND = process.env.ZZP_GARANTIE_BACKEND_URL || "http://localhost:7010";

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.ZZP_GARANTIE_FRONTEND_PORT || 7011),
    // The button calls `/api/create-session` and `/api/disclosed-attributes`
    // same-origin (it only prefixes a host when an apiKey is set), so the dev
    // server forwards /api to the middleware. That also keeps the browser away
    // from the verification_server's internal listener.
    proxy: {
      "/api": { target: BACKEND, changeOrigin: true },
    },
  },
  optimizeDeps: {
    // Linked via `file:`, so Vite would otherwise treat it as source and miss
    // its prebuilt CJS/ESM bundles.
    include: ["wallet-connect-button-react"],
  },
});
