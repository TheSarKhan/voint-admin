import { http } from "./client";
import type { PageResult, Tenant, TenantCreateInput } from "./types";
import { cacheTenant, getCachedTenant, invalidateTenant, clearTenantCache } from "./tenantCache";


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

export async function getTenant(tenantKey: string): Promise<Tenant> {
  const cached = getCachedTenant(tenantKey);
  if (cached) return cached;
  const { data } = await http.get<Tenant>(`/tenants/${tenantKey}`);
  return cacheTenant(data);
}

export async function createTenant(input: TenantCreateInput): Promise<Tenant> {
  const { data } = await http.post<Tenant>("/tenants", input);
  return cacheTenant(data);
}

/**
 * Bu tenant-in Vapi assistant-ini yaradir/yenileyir.
 * Backend butun 22 ayari ozu qurur — en vacibi metadata.tenant_id, o olmasa
 * bu biznesin zengleri baska biznesin bilik bazasindan cavablanir.
 */
/**
 * Konfiqurasiyanı yeniləyir. Göndərilməyən sahələr toxunulmaz qalır.
 *
 * Backend yadda saxladıqdan sonra assistant-ı Vapi-də də yeniləyir — salamlama və nitq lüğəti
 * orada da yaşayır, ona görə yalnız bazanı dəyişmək paneli zəng edənin eşitdiyi ilə uyğunsuz edərdi.
 */
export async function updateTenantConfig(
  tenantId: string,
  input: {
    name?: string | null;
    subdomain?: string | null;
    phoneNumber?: string | null;
    greetingText?: string | null;
    workingHours?: string | null;
    handoffNumber?: string | null;
    languageConfig?: string | null;
    sttDomain?: string | null;
    sttTopic?: string | null;
    sttVocabulary?: string | null;
    sttProvider?: string | null;
  },
): Promise<Tenant> {
  const { data } = await http.put<Tenant>(`/tenants/${tenantId}/config`, input);
  invalidateTenant(getCachedTenant(tenantId) ?? tenantId);
  return cacheTenant(data);
}

export async function syncTenantVapi(tenantId: string): Promise<Tenant> {
  const { data } = await http.post<Tenant>(`/tenants/${tenantId}/vapi-sync`);
  invalidateTenant(getCachedTenant(tenantId) ?? tenantId);
  return cacheTenant(data);
}

/** Butun tenant-lari yeniden gonderir — ses ayarlari deyisende lazim olur. */
export async function syncAllVapi(): Promise<number> {
  const { data } = await http.post<{ synced: number }>("/tenants/vapi-sync-all");
  // Hansı müəssisələrin dəyişdiyi bilinmir - hamısını atırıq.
  clearTenantCache();
  return data.synced;
}
