import { http } from "./client";
import type {
  BillingPlanInput,
  ProviderHealth,
  Tenant,
  UsageReport,
} from "./types";

/** Zeng ucun lazim olan xarici xidmetlerin veziyyeti (SUPER_ADMIN-only). */
export async function listProviderHealth(): Promise<ProviderHealth[]> {
  const { data } = await http.get<ProviderHealth[]>("/admin/providers");
  return data;
}

/**
 * Butun bizneslerin bir ayliq istifadesi ve hesabi (SUPER_ADMIN-only).
 * `month` bosdursa backend cari ayi goturur (Baki vaxti ile).
 */
export async function listUsage(month?: string): Promise<UsageReport[]> {
  const { data } = await http.get<UsageReport[]>("/admin/usage", {
    params: month ? { month } : undefined,
  });
  return data;
}

export async function getTenantUsage(
  tenantId: string,
  month?: string,
): Promise<UsageReport> {
  const { data } = await http.get<UsageReport>(`/tenants/${tenantId}/usage`, {
    params: month ? { month } : undefined,
  });
  return data;
}

export async function updateBillingPlan(
  tenantId: string,
  input: BillingPlanInput,
): Promise<Tenant> {
  const { data } = await http.put<Tenant>(`/tenants/${tenantId}/billing`, input);
  return data;
}
