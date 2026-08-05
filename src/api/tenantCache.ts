import type { Tenant } from "./types";

/**
 * Müəssisənin açar -> obyekt keşi.
 *
 * Nə üçün lazımdır: ünvanda subdomain durur ("texnika"), qalan endpoint-lər isə UUID istəyir,
 * ona görə hər səhifə əvvəlcə müəssisəni tapmalı olur. Müəssisə detalı, zəng detalı və qaimə
 * səhifəsi bunu ayrı-ayrı edirdi — bir zəngi açıb geri qayıtmaq eyni sorğunu üç dəfə verirdi.
 *
 * Keş HƏM UUID, həm subdomain açarı ilə doldurulur ki, hansı ilə soruşulmasından asılı olmasın.
 *
 * Nə üçün AYRICA fayl: keşi tenants.ts-də saxlamaq `store/auth -> api/tenants -> api/client ->
 * store/auth` dövrəsi yaradırdı. Modul dövrələri işləyə də bilər, amma yükləmə sırası dəyişən
 * kimi sınır və səbəbi tapılmır. Bu fayl heç nə import etmir, ona görə dövrə mümkün deyil.
 */
const tenantCache = new Map<string, Tenant>();

export function getCachedTenant(key: string): Tenant | undefined {
  return tenantCache.get(key);
}

export function cacheTenant(tenant: Tenant): Tenant {
  tenantCache.set(tenant.id, tenant);
  if (tenant.subdomain) tenantCache.set(tenant.subdomain, tenant);
  return tenant;
}

/** Bir müəssisəni keşdən çıxarır. Dəyişdirən hər əməliyyatdan sonra MÜTLƏQ çağırılmalıdır. */
export function invalidateTenant(tenant: Tenant | string | null | undefined): void {
  if (!tenant) return;
  if (typeof tenant === "string") {
    tenantCache.delete(tenant);
    return;
  }
  tenantCache.delete(tenant.id);
  if (tenant.subdomain) tenantCache.delete(tenant.subdomain);
}

/** Çıxışda sessiya ilə birlikdə keş də getməlidir — növbəti girən başqası ola bilər. */
export function clearTenantCache(): void {
  tenantCache.clear();
}
