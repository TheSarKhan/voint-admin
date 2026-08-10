import { useEffect, useState } from "react";
import { getQuestions } from "../api/questions";
import type { UnansweredQuestion } from "../api/types";
import { UnansweredQuestions } from "./UnansweredQuestions";
import { Alert, Spinner } from "./ui";

const STATUS_TABS: { value: "" | UnansweredQuestion["status"]; label: string }[] = [
  { value: "OPEN", label: "Açıq" },
  { value: "", label: "Hamısı" },
];

/**
 * Bilik bazası boşluqlarının bir müəssisə üzrə tam siyahısı.
 *
 * Faktiki cavablama işini `UnansweredQuestions` (AI qaralaması, RAG-a əlavə, bağla) artıq
 * görür - zəng detalı ekranında da eyni komponent işləyir. Bu tab yalnız siyahını
 * müəssisə səviyyəsində gətirir ki, açıq sualları görmək üçün zəng-zəng gəzmək lazım olmasın.
 */
export function QuestionsTab({
  tenantId,
  onChanged,
}: {
  tenantId: string;
  /** Tab-ın nişanını (açıq sual sayı) təzələmək üçün - bax TenantDetail. */
  onChanged?: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState<"" | UnansweredQuestion["status"]>("OPEN");
  const [questions, setQuestions] = useState<UnansweredQuestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setQuestions(null);
    getQuestions(tenantId, statusFilter || undefined)
      .then((q) => {
        if (!cancelled) setQuestions(q);
      })
      .catch(() => {
        if (!cancelled) setError("Suallar yüklənə bilmədi.");
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId, statusFilter]);

  const applyQuestion = (updated: UnansweredQuestion) => {
    setQuestions((prev) => (prev ? prev.map((q) => (q.id === updated.id ? updated : q)) : prev));
    onChanged?.();
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-fg">Cavabsız suallar</h2>
        <div className="flex gap-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setStatusFilter(t.value)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                statusFilter === t.value ? "bg-surface-2 text-fg" : "text-fg-muted hover:text-fg"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Alert tone="err">{error}</Alert>
        </div>
      )}

      {!questions ? (
        <Spinner />
      ) : questions.length === 0 ? (
        <p className="text-sm text-fg-faint">
          {statusFilter === "OPEN" ? "Açıq sual yoxdur." : "Bu süzgəcə uyğun sual yoxdur."}
        </p>
      ) : (
        <UnansweredQuestions tenantId={tenantId} questions={questions} onChanged={applyQuestion} />
      )}
    </div>
  );
}
