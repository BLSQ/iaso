import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const django = process.env.IASO_PROXY || "http://127.0.0.1:8081";

export default defineConfig({
  base: "/mcp/app/",
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": { target: django, changeOrigin: false },
      "/login": { target: django, changeOrigin: false },
      "/logout-iaso": { target: django, changeOrigin: false },
      "/admin": { target: django, changeOrigin: false },
      "/oauth": { target: django, changeOrigin: false },
      "/.well-known": { target: django, changeOrigin: false },
      "/register": { target: django, changeOrigin: false },
      "/static": { target: django, changeOrigin: false },
      "/mcp": { target: django, changeOrigin: false },
    },
  },
});
