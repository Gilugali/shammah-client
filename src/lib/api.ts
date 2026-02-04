import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect on 401 if we're not already on the sign-in page
    // This prevents redirect loops when checking auth status
    if (
      error.response?.status === 401 &&
      !window.location.pathname.includes("/sign-in")
    ) {
      // Handle unauthorized - redirect to login
      window.location.href = "/sign-in";
    }
    return Promise.reject(error);
  },
);

export default api;
