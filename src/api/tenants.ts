import { http } from "./client";
import type { PageResult, Tenant, TenantCreateInput } from "./types";

/** Serverden sehifelenmis, siralanmis ve axtarilmis tenant siyahisi. */
export async function listTenants(params: {
  q?: string;
  page?: number;
  size?: number;
  sort?: string | null;
  direction?: string;
}): Promise<PageResult<Tenant>> {
  const { data } = await http.get<PageResult<Tenant>>("/tenants", { params });
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
