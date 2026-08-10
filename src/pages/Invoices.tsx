import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { Link, useNavigate } from "react-router-dom";
import { listAllInvoices, lockInvoice, setInvoiceStatus } from "../api/billing";
import type { BillingInvoice, InvoiceStatus } from "../api/types";
import { clientPage, DataTable, type Column } from "../components/DataTable";
import { IconCheck, IconClose, IconLock, IconMore, IconSend } from "../components/icons";
import {
  Alert,
  DropdownMenu,
  InlineSpinner,
  PageHeader,
  Select,
  StatusText,
  type DropdownItem,
  type StatusTone,
} from "../components/ui";
import { currentMonth, formatDate, formatMoney, formatMonth, recentMonths } from "../lib/format";

function errorText(e: unknown, fallback: string): string {
  const err = e as AxiosError<{ detail?: string }>;
  return err.response?.data?.detail ?? fallback;
}

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: "Qaralama",
  SENT: "Göndərilib",
  PAID: "Ödənib",
  OVERDUE: "Gecikib",
  CANCELLED: "Ləğv edilib",
};

const STATUS_TONE: Record<InvoiceStatus, StatusTone> = {
  DRAFT: "neutral",
  SENT: "neutral",
  PAID: "ok",
  OVERDUE: "err",
  CANCELLED: "neutral",
};

/**
 * OVERDUE bazada demək olar heç vaxt qoyulmur - əl ilə dəyişdirilmədikcə. Real gecikməni bu
 * ekran özü hesablayır: SENT + son tarix keçib = gecikib, "kim ödəməyib" siyahısı doğru olsun.
 */
function effectiveStatus(inv: BillingInvoice): InvoiceStatus {
  if (inv.status === "SENT" && inv.dueDate && new Date(inv.dueDate) < new Date()) return "OVERDUE";
  return inv.status;
}

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "Bütün vəziyyətlər" },
  { value: "OVERDUE", label: "Gecikib" },
  { value: "SENT", label: "Göndərilib" },
  { value: "PAID", label: "Ödənib" },
  { value: "DRAFT", label: "Qaralama" },
  { value: "CANCELLED", label: "Ləğv edilib" },
];

function matchesInvoice(i: BillingInvoice, needle: string): boolean {
  return (i.tenantName ?? "").toLowerCase().includes(needle);
}

function compareInvoice(key: string): (a: BillingInvoice, b: BillingInvoice) => number {
  return (a, b) => {
    switch (key) {
      case "tenantName":
        return (a.tenantName ?? "").localeCompare(b.tenantName ?? "");
      case "totalAmount":
        return a.totalAmount - b.totalAmount;
      case "dueDate":
        return (a.dueDate ?? "").localeCompare(b.dueDate ?? "");
      case "status":
        return effectiveStatus(a).localeCompare(effectiveStatus(b));
      default:
        return 0;
    }
  };
}

export function InvoicesPage() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(currentMonth());
  const months = useMemo(() => recentMonths(12), []);
  const [statusFilter, setStatusFilter] = useState("");
  const [invoices, setInvoices] = useState<BillingInvoice[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = () => listAllInvoices(month).then(setInvoices);

  useEffect(() => {
    setInvoices(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const act = async (id: string, fn: () => Promise<unknown>) => {
    setBusyId(id);
    setError(null);
    try {
      await fn();
      await load();
      setRefreshTick((t) => t + 1);
    } catch (e) {
      setError(errorText(e, "Əməliyyat alınmadı."));
    } finally {
      setBusyId(null);
    }
  };

  const actionsFor = (inv: BillingInvoice): DropdownItem[] => {
    const items: DropdownItem[] = [];
    if (!inv.lockedAt) {
      items.push({ label: "Kilidlə", icon: IconLock, onSelect: () => act(inv.id, () => lockInvoice(inv.id)) });
    }
    if (inv.status !== "SENT") {
      items.push({
        label: "Göndərildi kimi işarələ",
        icon: IconSend,
        onSelect: () => act(inv.id, () => setInvoiceStatus(inv.id, "SENT")),
      });
    }
    if (inv.status !== "PAID") {
      items.push({
        label: "Ödənildi kimi işarələ",
        icon: IconCheck,
        onSelect: () => act(inv.id, () => setInvoiceStatus(inv.id, "PAID")),
      });
    }
    if (inv.status !== "CANCELLED") {
      items.push({
        label: "Ləğv et",
        icon: IconClose,
        danger: true,
        onSelect: () => act(inv.id, () => setInvoiceStatus(inv.id, "CANCELLED")),
      });
    }
    return items;
  };

  const filtered = (invoices ?? []).filter(
    (i) => !statusFilter || effectiveStatus(i) === statusFilter,
  );

  const columns: Column<BillingInvoice>[] = [
    {
      key: "tenantName",
      header: "Müəssisə",
      cell: (i) => (
        <Link
          to={`/tenants/${i.tenantSubdomain ?? i.tenantId}`}
          onClick={(e) => e.stopPropagation()}
          className="font-medium text-fg hover:underline"
        >
          {i.tenantName ?? "—"}
        </Link>
      ),
    },
    {
      header: "Dövr",
      cell: (i) => <span className="text-fg-muted">{formatMonth(i.period)}</span>,
    },
    {
      key: "totalAmount",
      header: "Məbləğ",
      numeric: true,
      cell: (i) => <span className="text-fg-muted">{formatMoney(i.totalAmount)}</span>,
    },
    {
      key: "dueDate",
      header: "Ödəniş tarixi",
      cell: (i) => <span className="text-fg-muted">{i.dueDate ? formatDate(i.dueDate) : "—"}</span>,
    },
    {
      key: "status",
      header: "Vəziyyət",
      cell: (i) => (
        <StatusText tone={STATUS_TONE[effectiveStatus(i)]}>{STATUS_LABEL[effectiveStatus(i)]}</StatusText>
      ),
    },
    {
      header: "",
      align: "right",
      cell: (i) => (
        <div className="flex justify-end">
          {busyId === i.id ? (
            <span className="flex h-8 w-8 items-center justify-center">
              <InlineSpinner />
            </span>
          ) : (
            <DropdownMenu
              trigger={
                <span
                  aria-label="Əməliyyatlar"
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
                >
                  <IconMore width={16} height={16} />
                </span>
              }
              items={actionsFor(i)}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Fakturalar" subtitle="Bütün müəssisələrin fakturaları - kim ödəyib, kim gecikib." />

      {error && (
        <div className="mb-4">
          <Alert tone="err">{error}</Alert>
        </div>
      )}

      <DataTable
        columns={columns}
        rowKey={(i) => i.id}
        defaultSort="tenantName"
        emptyMessage="Bu dövrdə heç bir faktura yoxdur."
        resetKey={`${month}-${statusFilter}-${refreshTick}`}
        fetchPage={clientPage(filtered, matchesInvoice, compareInvoice)}
        onRowClick={(i) => navigate(`/tenants/${i.tenantSubdomain ?? i.tenantId}`)}
        toolbar={
          <div className="flex gap-2">
            <Select
              aria-label="Dövr"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              options={months.map((m) => ({ value: m, label: formatMonth(m) }))}
              containerClassName="w-40"
            />
            <Select
              aria-label="Vəziyyət"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={STATUS_FILTER_OPTIONS}
              containerClassName="w-44"
            />
          </div>
        }
      />
    </div>
  );
}
