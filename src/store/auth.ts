import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "../api/types";
import { clearTenantCache } from "../api/tenantCache";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser, refreshToken?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      setSession: (token, user, refreshToken) =>
        set({ token, user, refreshToken: refreshToken ?? null }),
      logout: () => {
        // Müəssisə keşi sessiyaya bağlıdır: növbəti girən başqa adam ola bilər və
        // onun görməli olmadığı müəssisə yaddaşda qalmamalıdır (bax api/tenants.ts).
        clearTenantCache();
        set({ token: null, user: null, refreshToken: null });
      },
    }),
    {
      name: "voint-admin-auth",
    },
  ),
);
