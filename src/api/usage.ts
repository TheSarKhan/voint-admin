import { http } from "./client";
import type { BillingPlanInput, Tenant, UsageReport } from "./types";

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
