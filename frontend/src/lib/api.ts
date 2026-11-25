import axios, { AxiosError } from "axios";

// Always same-origin: nginx proxies /api in production and Vite proxies it in development (vite.config.ts),
// so the HttpOnly session cookie and the XSRF-TOKEN cookie work without cross-origin credentials.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
export const BACKEND_ROOT_URL = API_BASE_URL.replace(/\/api\/?$/, "");

/** Dispatched on window when the server answers 401 (session expired / account disabled). */
export const AUTH_EXPIRED_EVENT = "sewnexa:auth-expired";

declare module "axios" {
  interface AxiosError {
    /** Human-readable message for the UI (server message, or a network/timeout explanation). */
    userMessage?: string;
  }
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  // Axios copies the XSRF-TOKEN cookie into the X-XSRF-TOKEN header on same-origin requests (Spring Security CSRF).
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
});

/** Best message to show a user for a failed request. */
export function getErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  const e = error as AxiosError<{ message?: string }>;
  return e?.userMessage || e?.response?.data?.message || (error as Error)?.message || fallback;
}

// Unwrap the backend ApiResponse envelope ({ success, message, data }) automatically
api.interceptors.response.use(
  (response) => {
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  (error: AxiosError<{ message?: string }>) => {
    if (error.code === "ECONNABORTED") {
      error.userMessage = "The server took too long to respond. Please try again.";
    } else if (!error.response) {
      error.userMessage = "Cannot reach the server. Check your connection and try again.";
    } else {
      error.userMessage = error.response.data?.message || `Request failed (${error.response.status}).`;
      const url = error.config?.url || "";
      if (error.response.status === 401 && !url.includes("/auth/login")) {
        window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
      }
    }
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);
