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

/**
 * Bu tenant-in Vapi assistant-ini yaradir/yenileyir.
 * Backend butun 22 ayari ozu qurur — en vacibi metadata.tenant_id, o olmasa
 * bu biznesin zengleri baska biznesin bilik bazasindan cavablanir.
 */
export async function syncTenantVapi(tenantId: string): Promise<Tenant> {
  const { data } = await http.post<Tenant>(`/tenants/${tenantId}/vapi-sync`);
  return data;
}

/** Butun tenant-lari yeniden gonderir — ses ayarlari deyisende lazim olur. */
export async function syncAllVapi(): Promise<number> {
  const { data } = await http.post<{ synced: number }>("/tenants/vapi-sync-all");
  return data.synced;
}
