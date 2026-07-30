import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { getCall, getCalls } from "../api/calls";
import type { CallDetail, CallStatus, CallSummary } from "../api/types";
import { IconHeadset, IconRefresh, IconSearch } from "./icons";
import {
  Alert,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Input,
  InlineSpinner,
  Modal,
  Select,
  Spinner,
  StatusText,
  Table,
  TableContainer,
  TableEmpty,
  TBody,
  TD,
  TH,
  THead,
  TR,
  type StatusTone,
} from "./ui";
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

// HANDOFF "xəta" deyil — agent düzgün davranıb, sadəcə insana ötürüb. Ona görə err yox, warn:
// diqqət çəkməli, amma sıralamada qırmızı dəniz yaratmamalı.
const STATUS_TONE: Record<CallStatus, StatusTone> = {
  ONGOING: "neutral",
  RESOLVED: "ok",
  HANDOFF: "warn",
};

/**
 * Bir zəngin tam görünüşü.
 *
 * Transkript və AI xülasə hər zəng üçün yazılmır (webhook axını hələ onları doldurmur),
 * ona görə boş halda ekran "hələ yoxdur" deyir. Boş qutu göstərmək operatora "sistem
 * pozulub" kimi görünür, halbuki bu normal vəziyyətdir.
 */
function CallDetailModal({
  tenantId,
  callId,
  onClose,
}: {
  tenantId: string;
  callId: string;
  onClose: () => void;
}) {
  const [call, setCall] = useState<CallDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCall(tenantId, callId)
      .then((c) => {
        if (!cancelled) setCall(c);
      })
      .catch((e) => {
        if (!cancelled) setError(errorText(e, "Zəng məlumatı yüklənə bilmədi."));
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId, callId]);

  return (
    <Modal title="Zəng təfərrüatı" onClose={onClose} size="lg">
      {error && <Alert tone="err">{error}</Alert>}
      {!call && !error && <Spinner />}
      {call && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-fg-faint">Nömrə</p>
              <p className="mt-1 text-sm text-fg">{call.callerNumber || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-fg-faint">Başlayıb</p>
              <p className="mt-1 text-sm text-fg">{formatDateTime(call.startedAt)}</p>
            </div>
            <div>
              <p className="text-xs text-fg-faint">Müddət</p>
              <p className="mt-1 text-sm text-fg">{formatDuration(call.durationSec)}</p>
            </div>
            <div>
              <p className="text-xs text-fg-faint">Vəziyyət</p>
              <p className="mt-1 text-sm">
                <StatusText tone={STATUS_TONE[call.status]}>
                  {STATUS_LABEL[call.status]}
                </StatusText>
              </p>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-fg">AI xülasəsi</h3>
            {call.aiSummary ? (
              <p className="text-sm leading-relaxed text-fg-muted">{call.aiSummary}</p>
            ) : (
              <p className="text-sm text-fg-faint">
                Bu zəng üçün xülasə yazılmayıb.
              </p>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-fg">Transkript</h3>
            {call.fullTranscript ? (
              // Backend transkripti xam mətn bloku kimi saxlayır (strukturlaşdırılmış
              // "speaker turns" deyil), ona görə burada da süni şəkildə bölünmür.
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-surface-2 p-4 font-mono text-xs leading-relaxed text-fg-muted">
                {call.fullTranscript}
              </pre>
            ) : (
              <p className="text-sm text-fg-faint">
                Bu zəng üçün transkript yazılmayıb.
              </p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

export function CallsTab({ tenantId }: { tenantId: string }) {
  const [calls, setCalls] = useState<CallSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"ALL" | CallStatus>("ALL");
  const [openCallId, setOpenCallId] = useState<string | null>(null);

  const load = async (silent = false) => {
    if (silent) setRefreshing(true);
    try {
      setCalls(await getCalls(tenantId));
      setError(null);
    } catch (e) {
      setError(errorText(e, "Zəng siyahısı yüklənə bilmədi."));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    getCalls(tenantId)
      .then((c) => {
        if (!cancelled) setCalls(c);
      })
      .catch((e) => {
        if (!cancelled) setError(errorText(e, "Zəng siyahısı yüklənə bilmədi."));
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  // Backend bu endpoint-də səhifələmə/axtarış vermir (düz List qaytarır), ona görə
  // süzgəc brauzerdədir. Siyahı böyüyəndə bu yetməyəcək — o zaman backend-ə
  // səhifələmə əlavə edilməli, burada saxta səhifələmə qurulmamalıdır.
  const filtered = useMemo(() => {
    if (!calls) return [];
    const needle = q.trim().toLowerCase();
    return calls.filter((c) => {
      if (status !== "ALL" && c.status !== status) return false;
      if (!needle) return true;
      return c.callerNumber?.toLowerCase().includes(needle);
    });
  }, [calls, q, status]);

  if (error && !calls) return <Alert tone="err">{error}</Alert>;
  if (!calls) return <Spinner />;

  return (
    <Card>
      <CardHeader
        title="Zənglər"
        description={`${calls.length} zəng · ən yenisi əvvəldə`}
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={IconRefresh}
            loading={refreshing}
            onClick={() => load(true)}
          >
            Yenilə
          </Button>
        }
      />

      {calls.length > 0 && (
        <div className="flex flex-wrap items-end gap-3 px-6 pb-4">
          <Input
            containerClassName="w-64"
            icon={IconSearch}
            placeholder="Nömrə üzrə axtar"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Select
            containerClassName="w-52"
            value={status}
            onChange={(e) => setStatus(e.target.value as "ALL" | CallStatus)}
            options={[
              { value: "ALL", label: "Bütün vəziyyətlər" },
              { value: "RESOLVED", label: STATUS_LABEL.RESOLVED },
              { value: "HANDOFF", label: STATUS_LABEL.HANDOFF },
              { value: "ONGOING", label: STATUS_LABEL.ONGOING },
            ]}
          />
          {refreshing && <InlineSpinner />}
        </div>
      )}

      {error && (
        <div className="px-6 pb-4">
          <Alert tone="err">{error}</Alert>
        </div>
      )}

      {calls.length === 0 ? (
        <EmptyState
          icon={IconHeadset}
          title="Hələ zəng yoxdur"
          message="Bu müəssisəyə hələ zəng gəlməyib. Vapi assistant qurulubsa, ilk zəngdən sonra burada görünəcək."
        />
      ) : (
        <TableContainer>
          <Table>
            <THead>
              <TR>
                <TH>Tarix</TH>
                <TH>Nömrə</TH>
                <TH>Müddət</TH>
                <TH>Vəziyyət</TH>
                <TH>Dil</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.length === 0 ? (
                <TableEmpty colSpan={5} message="Süzgəcə uyğun zəng tapılmadı." />
              ) : (
                filtered.map((c) => (
                  <TR
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => setOpenCallId(c.id)}
                  >
                    <TD>{formatDateTime(c.startedAt)}</TD>
                    <TD>{c.callerNumber || "—"}</TD>
                    <TD>{formatDuration(c.durationSec)}</TD>
                    <TD>
                      <StatusText tone={STATUS_TONE[c.status]}>
                        {STATUS_LABEL[c.status]}
                      </StatusText>
                    </TD>
                    <TD>{c.languageDetected ?? "—"}</TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </TableContainer>
      )}

      {openCallId && (
        <CallDetailModal
          tenantId={tenantId}
          callId={openCallId}
          onClose={() => setOpenCallId(null)}
        />
      )}
    </Card>
  );
}
