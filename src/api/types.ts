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
  // Kommersiya sertleri (AZN). Yalniz SUPER_ADMIN deyise biler.
  monthlyFee: number;
  includedMinutes: number;
  overagePerMinute: number;
  createdAt: string; // ISO
}

// Backend (com.starsoft.voint.usage.dto.UsageReport) - bir tenant-in bir ayliq
// istifadesi, bizim provayderlere odediyimiz xerc ve musterinin bize borcu.
// Butun mebleglar AZN-dedir ki, ust-uste muqayise edile bilsin.
export interface UsageReport {
  tenantId: string;
  tenantName: string;
  month: string; // "2026-07"
  usage: {
    calls: number;
    durationSeconds: number;
    minutes: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    ttsCharacters: number;
  };
  cost: {
    tts: number;
    llm: number;
    vapi: number;
    stt: number;
    telephony: number;
    total: number;
  };
  plan: {
    monthlyFee: number;
    includedMinutes: number;
    overagePerMinute: number;
    overageMinutes: number;
  };
  invoiceAzn: number;
  marginAzn: number;
  marginPercent: number | null;
}

export interface BillingPlanInput {
  monthlyFee: number;
  includedMinutes: number;
  overagePerMinute: number;
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
