// voint-backend /api/v1 modelleri (frontend gorunusu)

export interface AuthUser {
  id: string;
  email: string;
  // SUPER_ADMIN hesablari heç bir tenant-a bagli deyil - backend bunu
  // null qaytarir (butun platforma cixisi).
  tenantId: string | null;
  role: string;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: AuthUser;
}

// Backend (com.starsoft.voint.tenant.dto.TenantResponse) - duz (flat) obyekt,
// voint-panel-deki kimi ayrica config alt-obyektine bolunmur (admin panelde
// her tenant-in xam sekli goruntulenir).
export interface Tenant {
  id: string;
  name: string;
  phoneNumber: string | null;
  greetingText: string | null;
  workingHours: string | null;
  handoffNumber: string | null;
  languageConfig: string | null;
  createdAt: string; // ISO
}

// Backend (com.starsoft.voint.tenant.dto.TenantCreateRequest) - name mecburidir,
// qalan saheler serbestdir.
export interface TenantCreateInput {
  name: string;
  phoneNumber?: string;
  greetingText?: string;
  workingHours?: string;
  handoffNumber?: string;
  languageConfig?: string;
}

export interface AnalyticsOverview {
  totalCalls: number;
  resolvedCalls: number;
  handoffCalls: number;
  ongoingCalls: number;
  resolutionRate: number; // 0..1
  reservationCount: number;
  avgDurationSec: number;
  callsByDay: { date: string; count: number }[];
}
