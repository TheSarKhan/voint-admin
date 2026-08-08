import { http } from "./client";

export interface PanelUser {
  id: string;
  tenantId: string | null;
  email: string;
  fullName: string | null;
  roleId: string | null;
  roleName: string | null;
  status: "ACTIVE" | "BLOCKED";
  lastLoginAt: string | null;
  createdAt: string;
}

/**
 * E-poçt göndərilibsə `password` NULL gəlir — göstəriləcək bir şey yoxdur.
 * Göndərilməyibsə şifrə buradadır və yalnız bir dəfə: bazada hash saxlanılır.
 */
export interface PanelUserCreated {
  user: PanelUser;
  password: string | null;
  emailed: boolean;
}

export interface AssignableRole {
  id: string;
  name: string;
  description: string;
}

/**
 * tenantId verilməzsə platforma (admin panelin öz) istifadəçiləri idarə olunur — backend-də
 * ayrıca /admin/users (bax RolesManager-in eyni naxışı /admin/roles üçün). İki fərqli yolun
 * səbəbi: /tenants/{id}/users artıq işlək, canlıdır — onu dəyişmək əvəzinə yeni, platform-only
 * bir yol əlavə etmək daha az riskli idi.
 */
function basePath(tenantId?: string): string {
  return tenantId ? `/tenants/${tenantId}/users` : "/admin/users";
}

export async function listUsers(tenantId?: string): Promise<PanelUser[]> {
  const { data } = await http.get<PanelUser[]>(basePath(tenantId));
  return data;
}

export async function listAssignableRoles(tenantId?: string): Promise<AssignableRole[]> {
  const { data } = await http.get<AssignableRole[]>(`${basePath(tenantId)}/assignable-roles`);
  return data;
}

export async function createUser(
  tenantId: string | undefined,
  input: { email: string; fullName?: string; roleId: string },
): Promise<PanelUserCreated> {
  const { data } = await http.post<PanelUserCreated>(basePath(tenantId), input);
  return data;
}

/**
 * E-poçt eyni zamanda giriş adıdır — dəyişdirilsə, istifadəçinin açıq sessiyası dayanır və
 * yeni ünvanla girməli olur. Rol, vəziyyət və şifrə toxunulmaz qalır.
 */
export async function updateUser(
  tenantId: string | undefined,
  userId: string,
  input: { email: string; fullName?: string },
): Promise<PanelUser> {
  const { data } = await http.put<PanelUser>(`${basePath(tenantId)}/${userId}`, input);
  return data;
}

export async function resetPassword(
  tenantId: string | undefined,
  userId: string,
): Promise<PanelUserCreated> {
  const { data } = await http.post<PanelUserCreated>(
    `${basePath(tenantId)}/${userId}/reset-password`,
  );
  return data;
}

export async function setUserStatus(
  tenantId: string | undefined,
  userId: string,
  status: "ACTIVE" | "BLOCKED",
): Promise<PanelUser> {
  const { data } = await http.put<PanelUser>(`${basePath(tenantId)}/${userId}/status`, { status });
  return data;
}

export async function changeUserRole(
  tenantId: string | undefined,
  userId: string,
  roleId: string,
): Promise<PanelUser> {
  const { data } = await http.put<PanelUser>(`${basePath(tenantId)}/${userId}/role`, { roleId });
  return data;
}

export async function deleteUser(tenantId: string | undefined, userId: string): Promise<void> {
  await http.delete(`${basePath(tenantId)}/${userId}`);
}
