import { http } from "./client";
import type { RoleDetail } from "./roles";

export interface Department {
  id: string;
  tenantId: string | null;
  name: string;
  description: string | null;
  /** Neçə rol bu departamentə aiddir. Departament silinsə, rollar qalır — sadəcə qruplaşmır. */
  roleCount: number;
}

export interface DepartmentUpsert {
  name: string;
  description?: string;
  tenantId?: string | null;
}

/** tenantId verilməsə platformanın öz departamentləri gəlir. */
export async function listDepartments(tenantId?: string): Promise<Department[]> {
  const { data } = await http.get<Department[]>("/admin/departments", {
    params: tenantId ? { tenantId } : undefined,
  });
  return data;
}

export async function createDepartment(input: DepartmentUpsert): Promise<Department> {
  const { data } = await http.post<Department>("/admin/departments", input);
  return data;
}

export async function updateDepartment(
  id: string,
  input: DepartmentUpsert,
): Promise<Department> {
  const { data } = await http.put<Department>(`/admin/departments/${id}`, input);
  return data;
}

export async function deleteDepartment(id: string): Promise<void> {
  await http.delete(`/admin/departments/${id}`);
}

/** Bir (şablon) departamentin öz rolları — köçürmədən əvvəlki seçim siyahısı üçün. */
export async function getDepartmentRoles(departmentId: string): Promise<RoleDetail[]> {
  const { data } = await http.get<RoleDetail[]>(`/admin/departments/${departmentId}/roles`);
  return data;
}

export interface DepartmentCopyResult {
  department: Department;
  copiedRoles: RoleDetail[];
}

/**
 * Şablon departamenti (və seçilən rolları) tenant-a köçürür. roleIds verilməsə hamısı köçürülür.
 * Ad toqquşması xəta vermir — backend avtomatik "Operator 2" kimi adlandırır.
 */
export async function copyDepartmentToTenant(
  departmentId: string,
  tenantId: string,
  roleIds?: string[],
): Promise<DepartmentCopyResult> {
  const { data } = await http.post<DepartmentCopyResult>(
    `/admin/departments/${departmentId}/copy-to/${tenantId}`,
    roleIds ? { roleIds } : undefined,
  );
  return data;
}
