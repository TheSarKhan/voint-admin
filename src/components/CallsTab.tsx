import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { getCalls } from "../api/calls";
import type { CallStatus, CallSummary } from "../api/types";
import { IconHeadset, IconRefresh, IconSearch } from "./icons";
import {
  Alert,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Input,
  InlineSpinner,
  Pagination,
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

const PAGE_SIZE = 20;

export function CallsTab({
  tenantId,
  tenantKey,
}: {
  tenantId: string;
  /** Ünvanda görünən açar (subdomain və ya UUID) — zəng səhifəsinin linki bununla qurulur. */
  tenantKey: string;
}) {
  const navigate = useNavigate();
  const [calls, setCalls] = useState<CallSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"ALL" | CallStatus>("ALL");
  const [page, setPage] = useState(1);

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

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Süzgəc dəyişəndə nəticə kiçilir; köhnə səhifə nömrəsində qalmaq boş cədvəl göstərir.
  const safePage = Math.min(page, pageCount);
  const visible = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );

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
                <TH>Bilik bazası</TH>
                <TH>Dil</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.length === 0 ? (
                <TableEmpty colSpan={6} message="Süzgəcə uyğun zəng tapılmadı." />
              ) : (
                visible.map((c) => (
                  <TR
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/tenants/${tenantKey}/calls/${c.id}`)}
                  >
                    <TD>{formatDateTime(c.startedAt)}</TD>
                    <TD>{c.callerNumber || "—"}</TD>
                    <TD>{formatDuration(c.durationSec)}</TD>
                    <TD>
                      <StatusText tone={STATUS_TONE[c.status]}>
                        {STATUS_LABEL[c.status]}
                      </StatusText>
                    </TD>
                    {/* Dizayn qaydası: nişan/badge yoxdur — vəziyyət düz rəngli mətndir. */}
                    <TD>
                      {c.openQuestionCount > 0 ? (
                        <StatusText tone="warn">
                          {c.openQuestionCount} cavabsız sual
                        </StatusText>
                      ) : (
                        <span className="text-fg-faint">—</span>
                      )}
                    </TD>
                    <TD>{c.languageDetected ?? "—"}</TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </TableContainer>
      )}

      {/* Backend GET /calls düz siyahı qaytarır — bütün zənglər onsuz da yüklənib,
          burada yalnız göstərilən hissə kəsilir. Pagination öz üst xəttini özü çəkir. */}
      {calls.length > 0 && (
        <Pagination
          page={safePage}
          pageCount={pageCount}
          onChange={setPage}
          totalLabel={`${filtered.length} zəng`}
        />
      )}

    </Card>
  );
}
