import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://175.41.233.105:8080",
        changeOrigin: true,
      },
      "/auth": {
        target: "http://175.41.233.105:8080",
        changeOrigin: true,
      },
    },
  },
  define: {
    global: "window",
  },
});
