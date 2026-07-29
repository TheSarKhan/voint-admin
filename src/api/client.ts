import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/auth";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export const http = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 8000,
});

// JWT-ni her sorguya elave et
http.interceptors.request.use((config) => {
  // Sorgu oz tokenini getiribse ona toxunmuruq: giris aninda store-da hele KOHNE token
  // oturur (sessiya /auth/me ugurla cavab verenden sonra yazilir), ve onu ustelemek
  // girisi olu tokenle gonderir - 401, ustelik "melumatlari yoxlayin" mesaji ile.
  if (config.headers.Authorization) {
    return config;
  }
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Access token 60 deqiqe yasayir. Vaxti bitende backend 401 qaytarir; biz refresh
 * token ile sessiyani sessizce yenileyib sorgunu tekrarlayiriq — istifadeci saatda
 * bir defe login sehifesine atilmasin.
 *
 * Eyni anda bir nece sorgu 401 alsa, hamisi eyni refresh emeliyyatini gozleyir
 * (asagidaki `pending`), yoxsa her biri ayrica refresh cagirar ve bir-birinin
 * tokenini kohnelder.
 */
let pending: Promise<string> | null = null;

async function refreshSession(): Promise<string> {
  const { refreshToken, setSession, user } = useAuthStore.getState();
  if (!refreshToken || !user) {
    throw new Error("refresh token yoxdur");
  }
  // Bu interceptor-a yeniden dusmesin deye xam axios ile cagirilir.
  const { data } = await axios.post<{
    accessToken: string;
    refreshToken: string;
  }>(`${API_URL}/api/v1/auth/refresh`, { refreshToken });
  setSession(data.accessToken, user, data.refreshToken);
  return data.accessToken;
}

function forceLogout() {
  useAuthStore.getState().logout();
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // /auth/* ozu 401 verirse yenilemeye cehd etmek menasizdir — dovreye dusme riski var.
    // Yalniz giris ve yenileme: /auth/me da bura dusurdu, halbuki tokenin vaxtinin
    // bitdiyini bildiren ESAS sorgu odur - yenilenmek evezine sessiya baglanirdi.
    const isAuthCall =
      original?.url?.includes("/auth/login") || original?.url?.includes("/auth/refresh");

    if (original && !original._retried && !isAuthCall) {
      original._retried = true;
      try {
        pending =
          pending ??
          refreshSession().finally(() => {
            pending = null;
          });
        const token = await pending;
        original.headers.Authorization = `Bearer ${token}`;
        return http(original);
      } catch {
        // Refresh token da bitib — sessiya hequqeten qurtarib.
        forceLogout();
        return Promise.reject(error);
      }
    }

    forceLogout();
    return Promise.reject(error);
  },
);
