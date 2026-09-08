import axios from "axios";

// Determine the base API URL dynamically: /api in production or localhost in dev
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:8085/api" : "/api");
export const BACKEND_ROOT_URL = API_BASE_URL.replace(/\/api\/?$/, "");

// Create a central Axios instance pointing to our Spring Boot backend
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add an interceptor to unwrap ApiResponse format automatically
api.interceptors.response.use(
  (response) => {
    // If the backend wraps the data in ApiResponse (e.g., { status, message, data })
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);
