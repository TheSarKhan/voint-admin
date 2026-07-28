import { http } from "./client";

export interface PermissionCatalog {
  resources: { value: string; label: string; platformOnly: boolean }[];
  actions: { value: string; label: string }[];
}

export interface RoleDetail {
  id: string;
  tenantId: string | null;
  name: string;
  description: string | null;
  template: boolean;
  /** Sistem rolu: adı dəyişdirilə bilər, silinə bilməz. */
  system: boolean;
  userCount: number;
  /** resurs -> icazə verilmiş əməliyyatlar. Sətir yoxdursa = icazə yoxdur. */
  permissions: Record<string, string[]>;
}

export interface RoleUpsert {
  name: string;
  description?: string;
  tenantId?: string | null;
  template?: boolean;
  permissions: Record<string, string[]>;
}

export async function getCatalog(): Promise<PermissionCatalog> {
  const { data } = await http.get<PermissionCatalog>("/admin/permissions/catalog");
  return data;
}

/** tenantId verilməsə platforma rolları və şablonlar gəlir. */
export async function listRoles(tenantId?: string): Promise<RoleDetail[]> {
  const { data } = await http.get<RoleDetail[]>("/admin/roles", {
    params: tenantId ? { tenantId } : undefined,
  });
  return data;
}

export async function createRole(input: RoleUpsert): Promise<RoleDetail> {
  const { data } = await http.post<RoleDetail>("/admin/roles", input);
  return data;
}

export async function updateRole(roleId: string, input: RoleUpsert): Promise<RoleDetail> {
  const { data } = await http.put<RoleDetail>(`/admin/roles/${roleId}`, input);
  return data;
}

export async function deleteRole(roleId: string): Promise<void> {
  await http.delete(`/admin/roles/${roleId}`);
}

export async function copyTemplateToTenant(
  templateId: string,
  tenantId: string,
): Promise<RoleDetail> {
  const { data } = await http.post<RoleDetail>(
    `/admin/roles/${templateId}/copy-to/${tenantId}`,
  );
  return data;
}
