import { http } from "./client";
import { invalidateTenant } from "./tenantCache";
import type { BillingCatalogPlan, BillingInvoice, BillingProfileInput, Tenant } from "./types";

export type BillingCatalogPlanInput = Omit<BillingCatalogPlan, "id" | "createdAt">;
export async function listBillingPlans() { const { data } = await http.get<BillingCatalogPlan[]>("/admin/billing/plans"); return data; }
export async function createBillingPlan(input: BillingCatalogPlanInput) { const { data } = await http.post<BillingCatalogPlan>("/admin/billing/plans", input); return data; }
export async function updateBillingCatalogPlan(id: string, input: BillingCatalogPlanInput) { const { data } = await http.put<BillingCatalogPlan>(`/admin/billing/plans/${id}`, input); return data; }
export async function updateBillingProfile(tenantId: string, input: BillingProfileInput) { const { data } = await http.put<Tenant>(`/admin/billing/tenants/${tenantId}/profile`, input); invalidateTenant(data); return data; }
export async function listInvoices(tenantId: string) { const { data } = await http.get<BillingInvoice[]>(`/tenants/${tenantId}/invoices`); return data; }
export async function generateInvoice(tenantId: string, period?: string) { const { data } = await http.post<BillingInvoice>(`/admin/billing/tenants/${tenantId}/invoices`, null, { params: period ? { period } : undefined }); return data; }
export async function lockInvoice(id: string) { const { data } = await http.post<BillingInvoice>(`/admin/billing/invoices/${id}/lock`); return data; }
export async function setInvoiceStatus(id: string, status: BillingInvoice["status"]) { const { data } = await http.put<BillingInvoice>(`/admin/billing/invoices/${id}/status`, { status }); return data; }
