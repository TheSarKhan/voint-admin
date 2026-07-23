import { http } from "./client";
import type { Tenant, TenantCreateInput } from "./types";

/** Butun tenant-lari qaytarir (SUPER_ADMIN-only endpoint). */
export async function listTenants(): Promise<Tenant[]> {
  const { data } = await http.get<Tenant[]>("/tenants");
  return data;
}

export async function getTenant(tenantId: string): Promise<Tenant> {
  const { data } = await http.get<Tenant>(`/tenants/${tenantId}`);
  return data;
}

export async function createTenant(input: TenantCreateInput): Promise<Tenant> {
  const { data } = await http.post<Tenant>("/tenants", input);
  return data;
}
