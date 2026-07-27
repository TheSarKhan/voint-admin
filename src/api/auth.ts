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
      "Bu hesabın admin panelə girişi yoxdur. Müəssisə hesabları öz panelindən istifadə edir: voint.sarkhan.az",
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
