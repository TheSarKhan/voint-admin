import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import {
  approveRequest,
  listApprovals,
  rejectRequest,
  type Approval,
} from "../api/approvals";
import { clientPage, DataTable, type Column } from "./DataTable";
import { Alert, Button, Modal, Spinner, StatusText } from "./ui";
import { formatDateTime } from "../lib/format";

function errorText(e: unknown, fallback: string): string {
  const err = e as AxiosError<{ detail?: string }>;
  return err.response?.data?.detail ?? fallback;
}

const STATUS_LABEL: Record<Approval["status"], string> = {
  PENDING: "gözləyir",
  APPROVED: "təsdiqlənib",
  REJECTED: "rədd edilib",
  FAILED: "icra olunmadı",
};

const STATUS_TONE: Record<Approval["status"], "neutral" | "ok" | "warn" | "err"> = {
  PENDING: "warn",
  APPROVED: "ok",
  REJECTED: "neutral",
  FAILED: "err",
};

const STATUS_TABS = [
  { value: "PENDING", label: "Gözləyənlər" },
  { value: "", label: "Hamısı" },
];

/** Sorğunun gövdəsini oxunaqlı göstərir; JSON deyilsə olduğu kimi qalır. */
function prettyBody(body: string | null): string | null {
  if (!body) return null;
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

function matchesApproval(a: Approval, needle: string): boolean {
  return (
    a.summary.toLowerCase().includes(needle) ||
    a.requestedByEmail.toLowerCase().includes(needle) ||
    (a.decidedByEmail ?? "").toLowerCase().includes(needle)
  );
}

function compareApproval(key: string): (a: Approval, b: Approval) => number {
  return (a, b) => {
    switch (key) {
      case "summary":
        return a.summary.localeCompare(b.summary);
      case "requestedByEmail":
        return a.requestedByEmail.localeCompare(b.requestedByEmail);
      case "createdAt":
        return a.createdAt.localeCompare(b.createdAt);
      case "status":
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  };
}

/**
 * Bir müəssisənin təsdiq növbəsi.
 *
 * Burada göstərilən əməliyyatlar HƏLƏ BAŞ VERMƏYİB. Təsdiqlənənə qədər heç biri icra
 * olunmayıb — reject/approve düymələri bunu dəyişən yeganə yoldur.
 */
export function ApprovalsTab({
  tenantId,
  onDecided,
}: {
  tenantId: string;
  onDecided?: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [rows, setRows] = useState<Approval[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Approval | null>(null);
  // DataTable "resetKey" deyisende oz sorgusunu tekrarlayir - statusFilter deyisende
  // sehifeni sifirlamaq, bir qerardan sonra ise siyahini teze etmek ucun ikisi bir yerde.
  const [refreshTick, setRefreshTick] = useState(0);

  const reload = () =>
    listApprovals(tenantId, statusFilter || undefined)
      .then(setRows)
      .catch(() => setError("Siyahı yüklənmədi."));

  useEffect(() => {
    setRows(null);
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, statusFilter]);

  const decide = async (row: Approval, approve: boolean, closeAfter = false) => {
    const note = approve ? undefined : (prompt("Rədd səbəbi (istəyə bağlı):") ?? undefined);
    setBusyId(row.id);
    setError(null);
    try {
      const result = approve
        ? await approveRequest(tenantId, row.id, note)
        : await rejectRequest(tenantId, row.id, note);
      if (result.status === "FAILED") {
        setError(result.failureDetail ?? "Əməliyyat icra olunmadı.");
      }
      await reload();
      setRefreshTick((t) => t + 1);
      onDecided?.();
      if (closeAfter) setViewing(null);
    } catch (e) {
      setError(errorText(e, "Əməliyyat alınmadı."));
    } finally {
      setBusyId(null);
    }
  };

  const columns: Column<Approval>[] = [
    {
      key: "summary",
      header: "Əməliyyat",
      cell: (a) => <span className="font-medium text-fg">{a.summary}</span>,
    },
    {
      key: "requestedByEmail",
      header: "Kim istəyib",
      cell: (a) => <span className="text-fg-muted">{a.requestedByEmail}</span>,
    },
    {
      key: "createdAt",
      header: "Nə vaxt",
      cell: (a) => <span className="text-fg-muted">{formatDateTime(a.createdAt)}</span>,
    },
    {
      key: "status",
      header: "Vəziyyət",
      cell: (a) => <StatusText tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</StatusText>,
    },
    {
      header: "Qərar",
      align: "right",
      cell: (a) =>
        a.status === "PENDING" ? (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={busyId === a.id}
              onClick={() => decide(a, false)}
            >
              Rədd et
            </Button>
            <Button size="sm" loading={busyId === a.id} onClick={() => decide(a, true)}>
              Təsdiqlə
            </Button>
          </div>
        ) : (
          <span className="text-xs text-fg-faint">
            {a.decidedByEmail ?? "—"}
            {a.decidedAt ? ` · ${formatDateTime(a.decidedAt)}` : ""}
          </span>
        ),
    },
  ];

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-fg">Təsdiqlər</h2>
        <p className="mt-1 text-xs text-fg-muted">
          Dəyişdirmə və silmə əməliyyatları burada gözləyir. Təsdiqlənənə qədər heç biri baş
          verməyib.
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <Alert tone="err">{error}</Alert>
        </div>
      )}

      {!rows ? (
        <Spinner />
      ) : (
        <DataTable
          columns={columns}
          rowKey={(a) => a.id}
          defaultSort="createdAt"
          defaultDirection="desc"
          searchPlaceholder="Nə, kim üzrə axtar…"
          emptyMessage={
            statusFilter === "PENDING"
              ? "Gözləyən sorğu yoxdur."
              : "Hələ heç bir əməliyyat təsdiqə göndərilməyib."
          }
          resetKey={`${statusFilter}-${refreshTick}`}
          fetchPage={clientPage(rows, matchesApproval, compareApproval)}
          onRowClick={(a) => setViewing(a)}
          toolbar={
            <div className="flex gap-1">
              {STATUS_TABS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setStatusFilter(t.value)}
                  className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                    statusFilter === t.value
                      ? "bg-surface-2 text-fg"
                      : "text-fg-muted hover:text-fg"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          }
        />
      )}

      {viewing && (
        <Modal title="Təsdiq sorğusu" onClose={() => setViewing(null)} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-fg-faint">Kim istəyib</p>
                <p className="mt-1 text-sm text-fg">{viewing.requestedByEmail}</p>
              </div>
              <div>
                <p className="text-xs text-fg-faint">Nə vaxt</p>
                <p className="mt-1 text-sm text-fg">{formatDateTime(viewing.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-fg-faint">Vəziyyət</p>
                <p className="mt-1 text-sm">
                  <StatusText tone={STATUS_TONE[viewing.status]}>
                    {STATUS_LABEL[viewing.status]}
                  </StatusText>
                </p>
              </div>
            </div>

            <div>
              <p className="mb-1 text-xs text-fg-faint">Sorğu</p>
              <p className="break-all font-mono text-xs text-fg-muted">
                {viewing.method} {viewing.path}
              </p>
            </div>

            {prettyBody(viewing.body) && (
              <div>
                <p className="mb-1 text-xs text-fg-faint">Göndərilən məlumat</p>
                <pre className="overflow-x-auto rounded-md border border-border bg-surface-2 p-3 font-mono text-xs text-fg-muted">
                  {prettyBody(viewing.body)}
                </pre>
              </div>
            )}

            {viewing.decisionNote && (
              <p className="text-sm text-fg-muted">Qeyd: {viewing.decisionNote}</p>
            )}
            {viewing.failureDetail && <Alert tone="err">{viewing.failureDetail}</Alert>}

            {viewing.status === "PENDING" && (
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  disabled={busyId === viewing.id}
                  onClick={() => decide(viewing, false, true)}
                >
                  Rədd et
                </Button>
                <Button loading={busyId === viewing.id} onClick={() => decide(viewing, true, true)}>
                  Təsdiqlə
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
