import { http } from "./client";
import type { AnalyticsOverview } from "./types";

// Backend (com.starsoft.voint.analytics.dto.AnalyticsResponse) sahe adlari panelin daxili
// AnalyticsOverview tipinden ferqlidir (avgDurationSeconds vs avgDurationSec) — voint-panel-deki
// eyni adapter pattern-i burada da tekrarlanir.
interface BackendAnalyticsResponse {
  tenantId: string;
  totalCalls: number;
  resolvedCalls: number;
  handoffCalls: number;
  ongoingCalls: number;
  reservationCount: number;
  resolutionRate: number;
  avgDurationSeconds: number;
  callsByDay: { date: string; count: number }[];
}

export async function getTenantAnalytics(tenantId: string): Promise<AnalyticsOverview> {
  const { data } = await http.get<BackendAnalyticsResponse>(`/tenants/${tenantId}/analytics`);
  return {
    totalCalls: data.totalCalls,
    resolvedCalls: data.resolvedCalls,
    handoffCalls: data.handoffCalls,
    ongoingCalls: data.ongoingCalls,
    resolutionRate: data.resolutionRate,
    reservationCount: data.reservationCount,
    avgDurationSec: data.avgDurationSeconds,
    callsByDay: data.callsByDay,
  };
}
