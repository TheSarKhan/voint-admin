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

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await http.post<BackendTokenResponse>("/auth/login", {
    email,
    password,
  });
  const user = await fetchMeWithToken(data.accessToken);
  return { token: data.accessToken, refreshToken: data.refreshToken, user };
}

export async function me(): Promise<AuthUser> {
  const { data } = await http.get<BackendMeResponse>("/auth/me");
  return toAuthUser(data);
}
