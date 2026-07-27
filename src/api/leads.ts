import { http } from "./client";
import type { Lead, LeadStatus, PageResult } from "./types";

/**
 * Landing-den gelen pilot sorgulari. Yazma yolu public-dir (landing-in logini yoxdur),
 * amma OXUMA yalniz SUPER_ADMIN-e acidir — sorgularda basqa adamlarin telefon nomresi var.
 */
export async function listLeads(params: {
  q?: string;
  status?: LeadStatus;
  page?: number;
  size?: number;
  sort?: string | null;
  direction?: string;
}): Promise<PageResult<Lead>> {
  const { data } = await http.get<PageResult<Lead>>("/admin/leads", { params });
  return data;
}

/** Hele baxilmamis sorgu sayi — sidebar-da gostermek ucun. */
export async function getNewLeadCount(): Promise<number> {
  const { data } = await http.get<{ newCount: number }>("/admin/leads/summary");
  return data.newCount;
}

export async function updateLead(
  id: string,
  input: { status: LeadStatus; note?: string | null },
): Promise<Lead> {
  const { data } = await http.patch<Lead>(`/admin/leads/${id}`, input);
  return data;
}
