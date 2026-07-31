import { http } from "./client";
import type { CallDetail, CallSummary, UnansweredQuestion } from "./types";

// Backend (com.starsoft.voint.call.dto.CallResponse) sahe adlari panelin daxili
// tiplerinden ferqlidir (durationSeconds vs durationSec) — voint-panel-deki eyni
// adapter pattern-i burada da tekrarlanir.
interface BackendCallResponse {
  id: string;
  tenantId: string;
  callerNumber: string;
  languageDetected: string | null;
  status: CallSummary["status"];
  durationSeconds: number | null;
  startedAt: string;
  endedAt: string | null;
  openQuestionCount: number;
}

interface BackendCallDetailResponse extends BackendCallResponse {
  fullTranscript: string | null;
  aiSummary: string | null;
  unansweredQuestions: UnansweredQuestion[] | null;
}

function toSummary(c: BackendCallResponse): CallSummary {
  return {
    id: c.id,
    callerNumber: c.callerNumber,
    languageDetected: c.languageDetected,
    startedAt: c.startedAt,
    endedAt: c.endedAt,
    durationSec: c.durationSeconds ?? 0,
    status: c.status,
    openQuestionCount: c.openQuestionCount ?? 0,
  };
}

/**
 * Backend butun zengleri bir siyahida qaytarir — sehifelenme YOXDUR
 * (CallController.list -> List<CallResponse>). Ona gore burada DataTable yox,
 * sade cedvel islenir: DataTable serverden sehifelemeye gore qurulub ve olmayan
 * sehifelemeni varmis kimi gostermek istifadecini aldadar.
 */
export async function getCalls(tenantId: string): Promise<CallSummary[]> {
  const { data } = await http.get<BackendCallResponse[]>(`/tenants/${tenantId}/calls`);
  return data.map(toSummary);
}

export async function getCall(tenantId: string, callId: string): Promise<CallDetail> {
  const { data } = await http.get<BackendCallDetailResponse>(
    `/tenants/${tenantId}/calls/${callId}`,
  );
  return {
    ...toSummary(data),
    aiSummary: data.aiSummary,
    fullTranscript: data.fullTranscript,
    unansweredQuestions: data.unansweredQuestions ?? [],
  };
}
