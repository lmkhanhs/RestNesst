import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL(".", import.meta.url)), "VITE_");
  const backendUrl = (env.VITE_BACKEND_URL || "http://localhost:8080").trim().replace(/\/+$/, "");

  return {
    plugins: [react()],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    server: {
      proxy: {
        "/api": { target: backendUrl, changeOrigin: true },
        "/auth": { target: backendUrl, changeOrigin: true },
      },
    },
    define: { global: "window" },
  };
});
