import { http } from "./client";
import type { AuthUser, LoginResponse } from "./types";

// Backend (com.starsoft.voint.auth) sekilleri — panelin daxili LoginResponse/AuthUser
// tipleri ile fergli olduguna gore burada map edilir (voint-panel-deki eyni pattern).
interface BackendTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

interface BackendMeResponse {
  id: string;
  tenantId: string | null;
  email: string;
  role: string;
}

function toAuthUser(me: BackendMeResponse): AuthUser {
  return {
    id: me.id,
    email: me.email,
    tenantId: me.tenantId,
    role: me.role,
  };
}

/** /auth/me-ni verilmis access token ile cagirir — hele store-a yazilmamis tokenler ucun. */
async function fetchMeWithToken(accessToken: string): Promise<AuthUser> {
  const { data } = await http.get<BackendMeResponse>("/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return toAuthUser(data);
}

/**
 * Bu panel yalniz SUPER_ADMIN ucundur.
 *
 * Rolu burada yoxlamaq vacibdir: backend giris ucun her keceli istifadecini qebul edir,
 * lakin admin endpointleri SUPER_ADMIN teleb edir. Yoxlamasaq, muessise admini (mes.
 * admin@ces.az) rahat daxil olur, panel acilir — ve sonra HER sorgu 403 ile dusur,
 * hec bir izahat olmadan. Sistem sebebi bilir; demelidir.
 */
export class WrongPanelError extends Error {
  constructor() {
    super(
      "Bu hesabın admin panelə girişi yoxdur. Müəssisə hesabları öz panelindən istifadə edir.",
    );
    this.name = "WrongPanelError";
  }
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await http.post<BackendTokenResponse>("/auth/login", {
    email,
    password,
  });
  const user = await fetchMeWithToken(data.accessToken);
  if (user.role !== "SUPER_ADMIN") {
    throw new WrongPanelError();
  }
  return { token: data.accessToken, refreshToken: data.refreshToken, user };
}

export async function me(): Promise<AuthUser> {
  const { data } = await http.get<BackendMeResponse>("/auth/me");
  return toAuthUser(data);
}

/**
 * "Şifrəmi unutdum" — e-poçtla sıfırlama linki istəyir.
 *
 * Backend həmişə 202 qaytarır: e-poçtun qeydiyyatda olub-olmaması AÇIQLANMIR. Ona görə UI də
 * "hesab varsa link göndərildi" deyir, "belə hesab yoxdur" demir — əks halda bu endpoint
 * e-poçt yoxlamaq üçün istifadə oluna bilərdi.
 */
export async function forgotPassword(email: string): Promise<void> {
  await http.post("/auth/forgot-password", { email });
}

/** Linkdəki token + yeni şifrə. Uğurlu olsa köhnə şifrə dərhal işləməyi dayandırır. */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await http.post("/auth/reset-password", { token, newPassword });
}

