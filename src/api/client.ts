import axios, { AxiosError } from "axios";
import { useAuthStore } from "../store/auth";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export const http = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 8000,
});

// JWT-ni her sorguya elave et
http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 → sessiyani bitir ve login sehifesine yonlendir
http.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);
