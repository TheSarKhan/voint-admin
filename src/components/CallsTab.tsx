import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { getCalls } from "../api/calls";
import type { CallStatus, CallSummary } from "../api/types";
import { clientPage, DataTable, type Column } from "./DataTable";
import { IconRefresh } from "./icons";
import { Alert, Button, Select, StatusText, type StatusTone } from "./ui";
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

function matchesCall(c: CallSummary, needle: string): boolean {
  return (c.callerNumber ?? "").toLowerCase().includes(needle);
}

function compareCall(key: string): (a: CallSummary, b: CallSummary) => number {
  return (a, b) => {
    switch (key) {
      case "startedAt":
        return a.startedAt.localeCompare(b.startedAt);
      case "callerNumber":
        return (a.callerNumber ?? "").localeCompare(b.callerNumber ?? "");
      case "durationSec":
        return a.durationSec - b.durationSec;
      case "status":
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  };
}

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
  const [status, setStatus] = useState<"ALL" | CallStatus>("ALL");
  const [refreshing, setRefreshing] = useState(false);
  // DataTable oz sorgusunu yalniz "resetKey" deyisende tekrarlayir - status suzgeci ve
  // "Yenile"den sonra teze siyahini gormek ucun ikisini burada birlesdiririk.
  const [refreshTick, setRefreshTick] = useState(0);

  const load = async (silent = false) => {
    if (silent) setRefreshing(true);
    try {
      setCalls(await getCalls(tenantId));
      setError(null);
      setRefreshTick((t) => t + 1);
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
  const filtered = (calls ?? []).filter((c) => status === "ALL" || c.status === status);

  const columns: Column<CallSummary>[] = [
    {
      key: "startedAt",
      header: "Tarix",
      cell: (c) => (
        <Link
          to={`/tenants/${tenantKey}/calls/${c.id}`}
          // Sətrin özü onsuz da naviqasiya edir; linkin klikini ona ötürsək eyni keçid
          // iki dəfə işləyər. DataTable özü də düymə/link üstündə klikə toxunmur.
          onClick={(e) => e.stopPropagation()}
          className="rounded text-fg outline-none hover:underline focus-visible:ring-2 focus-visible:ring-fg-muted"
        >
          {formatDateTime(c.startedAt)}
        </Link>
      ),
    },
    {
      key: "callerNumber",
      header: "Nömrə",
      cell: (c) => <span className="text-fg-muted">{c.callerNumber || "—"}</span>,
    },
    {
      key: "durationSec",
      header: "Müddət",
      numeric: true,
      cell: (c) => <span className="text-fg-muted">{formatDuration(c.durationSec)}</span>,
    },
    {
      key: "status",
      header: "Vəziyyət",
      cell: (c) => <StatusText tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</StatusText>,
    },
    {
      header: "Bilik bazası",
      // Dizayn qaydası: nişan/badge yoxdur — vəziyyət düz rəngli mətndir.
      cell: (c) =>
        c.openQuestionCount > 0 ? (
          <StatusText tone="warn">{c.openQuestionCount} cavabsız sual</StatusText>
        ) : (
          <span className="text-fg-faint">—</span>
        ),
    },
    {
      header: "Dil",
      cell: (c) => <span className="text-fg-muted">{c.languageDetected ?? "—"}</span>,
    },
  ];

  if (error && !calls) return <Alert tone="err">{error}</Alert>;
  if (!calls) return null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-fg">Zənglər</h2>
          <p className="mt-1 text-xs text-fg-muted">{calls.length} zəng · ən yenisi əvvəldə</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={IconRefresh}
          loading={refreshing}
          onClick={() => load(true)}
        >
          Yenilə
        </Button>
      </div>

      {error && (
        <div className="mb-4">
          <Alert tone="err">{error}</Alert>
        </div>
      )}

      <DataTable
        columns={columns}
        rowKey={(c) => c.id}
        defaultSort="startedAt"
        defaultDirection="desc"
        searchPlaceholder="Nömrə üzrə axtar"
        emptyMessage="Hələ zəng yoxdur. Vapi assistant qurulubsa, ilk zəngdən sonra burada görünəcək."
        resetKey={`${status}-${refreshTick}`}
        fetchPage={clientPage(filtered, matchesCall, compareCall)}
        onRowClick={(c) => navigate(`/tenants/${tenantKey}/calls/${c.id}`)}
        toolbar={
          <Select
            containerClassName="w-52"
            aria-label="Vəziyyət"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as "ALL" | CallStatus);
              setRefreshTick((t) => t + 1);
            }}
            options={[
              { value: "ALL", label: "Bütün vəziyyətlər" },
              { value: "RESOLVED", label: STATUS_LABEL.RESOLVED },
              { value: "HANDOFF", label: STATUS_LABEL.HANDOFF },
              { value: "ONGOING", label: STATUS_LABEL.ONGOING },
            ]}
          />
        }
      />
    </div>
  );
}
