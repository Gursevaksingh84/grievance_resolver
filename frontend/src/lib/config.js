// Strip trailing slash to prevent double-slash in API calls (e.g., "…app//api/…")
const rawUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
export const API_URL = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
