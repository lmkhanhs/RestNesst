// One origin for REST requests, uploaded images and WebSocket connections.
export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:8080")
  .trim()
  .replace(/\/+$/, "");
