import { http } from "./client";

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
