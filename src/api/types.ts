// Backend (com.starsoft.voint.common.dto.PageResponse) — butun sehifelenmis
// siyahilar ucun eyni zerf. `sort`/`direction` serverin FAKTIKI tetbiq etdiyidir:
// bilinmeyen sutun defolta dusur, cedvel de real veziyyeti gostermelidir.
export interface PageResult<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  sort: string | null;
  direction: string | null;
}

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
  /** Panel unvani: "ces" -> ces.voint.az. null = bu muessisenin oz paneli yoxdur. */
  subdomain: string | null;
  phoneNumber: string | null;
  greetingText: string | null;
  workingHours: string | null;
  handoffNumber: string | null;
  languageConfig: string | null;
  // Kommersiya sertleri (AZN). Yalniz SUPER_ADMIN deyise biler.
  monthlyFee: number;
  includedMinutes: number;
  overagePerMinute: number;
  /** Sert aylik tavan (deqiqe); 0 = limitsiz. Plandan ferqlidir — bu xerc muhafizesidir. */
  monthlyMinuteCap: number;
  /** Vapi-deki assistant id; null = hele qurulmayib, zeng qebul etmir. */
  vapiAssistantId: string | null;
  sttDomain: string | null;
  sttTopic: string | null;
  sttVocabulary: string | null;
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
    monthlyMinuteCap: number;
    capPercentUsed: number | null;
  };
  invoiceAzn: number;
  marginAzn: number;
  marginPercent: number | null;
}

// Backend (com.starsoft.voint.health.ProviderHealth) — zeng ucun lazim olan
// xarici xidmetlerin son yoxlanilmis veziyyeti.
export interface ProviderHealth {
  name: string;
  status: "OK" | "DOWN" | "NOT_CONFIGURED";
  detail: string;
  checkedAt: string; // ISO
}

// Backend (com.starsoft.voint.settings.dto.SettingView) — provayder acarlari.
// `hint` maskalanmis izdir (son dord simvol); acarin ozu heç vaxt brauzere gelmir.
export interface SettingView {
  key: string;
  label: string;
  description: string;
  secret: boolean;
  configured: boolean;
  /** true — panelden idare olunur; false — serverin konfiqurasiyasindan gelir. */
  managedHere: boolean;
  hint: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface BillingPlanInput {
  monthlyFee: number;
  includedMinutes: number;
  overagePerMinute: number;
  monthlyMinuteCap: number;
}

// Backend (com.starsoft.voint.tenant.dto.TenantCreateRequest) - name mecburidir,
// qalan saheler serbestdir.
export interface TenantCreateInput {
  name: string;
  subdomain?: string;
  phoneNumber?: string;
  greetingText?: string;
  workingHours?: string;
  handoffNumber?: string;
  languageConfig?: string;
  sttDomain?: string;
  sttTopic?: string;
  sttVocabulary?: string;
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

// Backend (com.starsoft.voint.call.CallStatus). ONGOING = zeng hele bitmeyib,
// RESOLVED = agent ozu hell edib, HANDOFF = insana oturulub.
export type CallStatus = "ONGOING" | "RESOLVED" | "HANDOFF";

export interface CallSummary {
  id: string;
  callerNumber: string;
  /** Backend hazirda hemise "az" qaytarir (detectLanguage() sabitdir). */
  languageDetected: string | null;
  startedAt: string; // ISO
  endedAt: string | null;
  durationSec: number;
  status: CallStatus;
}

// GET /calls/{callId} call_transcripts cedvelinden transkript + AI xulaseni elave edir.
// Hazirki webhook axini her zeng ucun transkript yazmir — buna gore her iki sahe
// null ola biler ve ekran bunu "hele yoxdur" kimi izah etmelidir, bos qutu kimi yox.
export interface CallDetail extends CallSummary {
  aiSummary: string | null;
  fullTranscript: string | null;
}

/** Muessisenin bilik bazasi — agent cavablari buradan RAG ile qurur. */
export interface RagDocument {
  id: string;
  tenantId: string;
  content: string;
  category: string | null;
  source: string | null;
  createdAt: string; // ISO
}

export interface RagDocumentInput {
  content: string;
  category?: string;
  source?: string;
}

/** Landing sehifesindeki pilot formundan gelen sorgu. Hele musteri deyil. */
export type LeadStatus = "NEW" | "CONTACTED" | "CONVERTED" | "REJECTED";

export interface Lead {
  id: string;
  fullName: string;
  company: string;
  industry?: string | null;
  phone: string;
  email: string;
  dailyCallVolume?: string | null;
  source: string;
  status: LeadStatus;
  note?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}
