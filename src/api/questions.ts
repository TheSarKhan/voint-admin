import { http } from "./client";
import type { DraftAnswer, UnansweredQuestion } from "./types";

// Bilik bazasindaki bosluqlar: zengden sonraki tehlil agentin cavablaya bilmediyi suallari
// tapir, burdaki emeliyyatlar da onlari baglayir.
//
// Mock fallback QESDEN yoxdur (bax calls.ts / rag.ts). Bu emeliyyatlar bilik bazasini
// deyisir — backend elcatmayan halda "ugurlu oldu" gostermek operatoru cavabin yazildigina
// inandirar, halbuki hec ne yazilmayib.

export async function getQuestions(
  tenantId: string,
  status?: UnansweredQuestion["status"],
): Promise<UnansweredQuestion[]> {
  const { data } = await http.get<UnansweredQuestion[]>(
    `/tenants/${tenantId}/questions`,
    { params: status ? { status } : undefined },
  );
  return data;
}

/** AI qaralamasi. Hec ne saxlanilmir — netice sadece formaya doldurulur. */
export async function draftAnswer(
  tenantId: string,
  questionId: string,
): Promise<DraftAnswer> {
  // Gemini cagirisi — defolt 8 saniyelik timeout bunun ucun azdir.
  const { data } = await http.post<DraftAnswer>(
    `/tenants/${tenantId}/questions/${questionId}/draft`,
    {},
    { timeout: 45000 },
  );
  return data;
}

/** Cavabi bilik bazasina yazir ve suali baglayir. */
export async function answerQuestion(
  tenantId: string,
  questionId: string,
  input: { content: string; category?: string; source?: string },
): Promise<UnansweredQuestion> {
  // Backend senedi yaradarken embedding hesablayir (Gemini) — bu da 8 saniyeden uzun cekе biler.
  const { data } = await http.post<UnansweredQuestion>(
    `/tenants/${tenantId}/questions/${questionId}/answer`,
    input,
    { timeout: 45000 },
  );
  return data;
}

/** "Buna cavab lazim deyil" — sual siyahidan cixir, silinmir. */
export async function dismissQuestion(
  tenantId: string,
  questionId: string,
): Promise<UnansweredQuestion> {
  const { data } = await http.post<UnansweredQuestion>(
    `/tenants/${tenantId}/questions/${questionId}/dismiss`,
    {},
  );
  return data;
}
