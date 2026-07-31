import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AxiosError } from "axios";
import { getCall } from "../api/calls";
import { getTenant } from "../api/tenants";
import type { CallDetail, CallStatus, UnansweredQuestion } from "../api/types";
import { IconArrowLeft } from "../components/icons";
import { UnansweredQuestions } from "../components/UnansweredQuestions";
import {
  Alert,
  Card,
  CardBody,
  CardHeader,
  PageHeader,
  Spinner,
  StatusText,
  type StatusTone,
} from "../components/ui";
import { formatDateTime, formatDuration } from "../lib/format";

function errorText(e: unknown, fallback: string): string {
  const err = e as AxiosError<{ detail?: string }>;
  return err.response?.data?.detail ?? fallback;
}

const STATUS_LABEL: Record<CallStatus, string> = {
  ONGOING: "Davam edir",
  RESOLVED: "Həll olunub",
  HANDOFF: "Operatora ötürülüb",
};

// HANDOFF "xəta" deyil — agent düzgün davranıb, sadəcə insana ötürüb.
const STATUS_TONE: Record<CallStatus, StatusTone> = {
  ONGOING: "neutral",
  RESOLVED: "ok",
  HANDOFF: "warn",
};

/**
 * Bir zəngin öz səhifəsi.
 *
 * Əvvəl bu pəncərə (modal) idi. Cavabsız sual axını gələndə pəncərə dar gəldi: operator sualı
 * oxuyur, cavab yazır, AI qaralamasına baxır — bu, üstünə açılan bir qutuda deyil, öz səhifəsində
 * olmalıdır. Ünvanı da var, yəni bir zəngi həmkarına linklə göndərmək mümkündür.
 */
export function CallDetailPage() {
  const { tenantKey, callId } = useParams<{ tenantKey: string; callId: string }>();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string>("");
  const [call, setCall] = useState<CallDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantKey || !callId) return;
    let cancelled = false;
    // Ünvanda subdomain ola bilər (/tenants/texnika/...), zəng endpoint-i isə UUID gözləyir —
    // əvvəlcə müəssisəni tapırıq, sonra onun HƏQİQİ id-si ilə zəngi.
    getTenant(tenantKey)
      .then(async (t) => {
        if (cancelled) return;
        setTenantId(t.id);
        setTenantName(t.name);
        const c = await getCall(t.id, callId);
        if (!cancelled) setCall(c);
      })
      .catch((e) => {
        if (!cancelled) setError(errorText(e, "Zəng məlumatı yüklənə bilmədi."));
      });
    return () => {
      cancelled = true;
    };
  }, [tenantKey, callId]);

  const applyQuestion = (updated: UnansweredQuestion) =>
    setCall((prev) =>
      prev
        ? {
            ...prev,
            unansweredQuestions: prev.unansweredQuestions.map((q) =>
              q.id === updated.id ? updated : q,
            ),
          }
        : prev,
    );

  if (error) return <Alert tone="err">{error}</Alert>;
  if (!call || !tenantId) return <Spinner />;

  return (
    <div>
      <Link
        to={`/tenants/${tenantKey}`}
        className="mb-4 inline-flex items-center gap-2 text-sm text-fg-muted transition-colors hover:text-fg"
      >
        <IconArrowLeft width={14} height={14} />
        {tenantName || "Müəssisəyə"} qayıt
      </Link>

      <PageHeader
        title={call.callerNumber || "Naməlum nömrə"}
        subtitle={`${formatDateTime(call.startedAt)} · ${formatDuration(call.durationSec)}${
          call.languageDetected ? ` · ${call.languageDetected}` : ""
        }`}
        actions={
          <StatusText tone={STATUS_TONE[call.status]}>
            {STATUS_LABEL[call.status]}
          </StatusText>
        }
      />

      <UnansweredQuestions
        tenantId={tenantId}
        questions={call.unansweredQuestions}
        onChanged={applyQuestion}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader title="AI xülasəsi" />
          <CardBody>
            {call.aiSummary ? (
              <p className="text-sm leading-relaxed text-fg-muted">{call.aiSummary}</p>
            ) : (
              <p className="text-sm text-fg-faint">Bu zəng üçün xülasə yazılmayıb.</p>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader title="Transkript" />
          <CardBody>
            {call.fullTranscript ? (
              // Backend transkripti xam mətn bloku kimi saxlayır (strukturlaşdırılmış
              // "speaker turns" deyil), ona görə burada da süni şəkildə bölünmür.
              <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-fg-muted">
                {call.fullTranscript}
              </pre>
            ) : (
              <p className="text-sm text-fg-faint">Bu zəng üçün transkript yazılmayıb.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
