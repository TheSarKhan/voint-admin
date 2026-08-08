import { http } from "./client";

export interface Approval {
  id: string;
  requestedByEmail: string;
  method: string;
  path: string;
  /** Sorğunun öz gövdəsi. Ümumi cümlə "nə" olduğunu deyir, bu isə "tam olaraq nəyi". */
  body: string | null;
  resource: string;
  action: string;
  summary: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "FAILED";
  createdAt: string;
  decidedAt: string | null;
  decidedByEmail: string | null;
  decisionNote: string | null;
  failureDetail: string | null;
}

export async function listApprovals(
  tenantId: string,
  status?: string,
): Promise<Approval[]> {
  const { data } = await http.get<Approval[]>(`/tenants/${tenantId}/approvals`, {
    params: status ? { status } : undefined,
  });
  return data;
}

/** Tab-daki nişan üçün — siyahının hamısını çəkmədən sayı almaq. */
export async function pendingApprovalCount(tenantId: string): Promise<number> {
  const { data } = await http.get<{ pending: number }>(
    `/tenants/${tenantId}/approvals/pending-count`,
  );
  return data.pending;
}

/**
 * POST, PUT deyil — bilərəkdən.
 *
 * PUT və DELETE sorğuları elə təsdiq növbəsinin özünə düşür; növbəni onlarla idarə etsək,
 * ilk saxlanan əməliyyat növbəni əbədi dondurardı.
 */
export async function approveRequest(
  tenantId: string,
  id: string,
  note?: string,
): Promise<Approval> {
  const { data } = await http.post<Approval>(
    `/tenants/${tenantId}/approvals/${id}/approve`,
    { note },
  );
  return data;
}

export async function rejectRequest(
  tenantId: string,
  id: string,
  note?: string,
): Promise<Approval> {
  const { data } = await http.post<Approval>(
    `/tenants/${tenantId}/approvals/${id}/reject`,
    { note },
  );
  return data;
}
