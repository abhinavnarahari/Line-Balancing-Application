import axios from "axios";

// Create a central Axios instance pointing to our Spring Boot backend
export const api = axios.create({
  baseURL: "http://localhost:8080/api",
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
