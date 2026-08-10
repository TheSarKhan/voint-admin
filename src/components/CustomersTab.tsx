import { useEffect, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import {
  createCustomer,
  getCustomers,
  updateCustomer,
  type Customer,
} from "../api/customers";
import { getCalls } from "../api/calls";
import type { CallSummary } from "../api/types";
import { clientPage, DataTable, type Column } from "./DataTable";
import { IconEdit, IconPlus } from "./icons";
import { Alert, Button, Field, inputCls, Modal, StatusText, type StatusTone } from "./ui";
import { formatDateTime, formatDuration } from "../lib/format";

function errorText(e: unknown, fallback: string): string {
  const err = e as AxiosError<{ detail?: string }>;
  return err.response?.data?.detail ?? fallback;
}

const CALL_STATUS_LABEL: Record<CallSummary["status"], string> = {
  RESOLVED: "Həll olunub",
  HANDOFF: "Operatora ötürülüb",
  ONGOING: "Davam edir",
};

const CALL_STATUS_TONE: Record<CallSummary["status"], StatusTone> = {
  RESOLVED: "ok",
  HANDOFF: "warn",
  ONGOING: "neutral",
};

function matchesCustomer(c: Customer, needle: string): boolean {
  return (
    (c.name ?? "").toLowerCase().includes(needle) ||
    c.phoneNumber.toLowerCase().includes(needle) ||
    (c.notes ?? "").toLowerCase().includes(needle)
  );
}

function compareCustomer(key: string): (a: Customer, b: Customer) => number {
  return (a, b) => {
    switch (key) {
      case "name":
        return (a.name ?? "").localeCompare(b.name ?? "");
      case "phoneNumber":
        return a.phoneNumber.localeCompare(b.phoneNumber);
      case "callCount":
        return a.callCount - b.callCount;
      case "lastSeenAt":
        return a.lastSeenAt.localeCompare(b.lastSeenAt);
      default:
        return 0;
    }
  };
}

interface FormState {
  phoneNumber: string;
  name: string;
  notes: string;
}

const emptyForm: FormState = { phoneNumber: "", name: "", notes: "" };

/**
 * Müştəri kartı adətən zəng bitəndə avtomatik yaranır (nömrəyə görə tanınır) - bu tab
 * onları görmək, qeyd əlavə etmək və əl ilə bir kart yaratmaq üçündür.
 */
export function CustomersTab({ tenantId }: { tenantId: string }) {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [calls, setCalls] = useState<CallSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Customer | null>(null);
  const [editing, setEditing] = useState<Customer | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getCustomers(tenantId), getCalls(tenantId)])
      .then(([cs, cl]) => {
        if (cancelled) return;
        setCustomers(cs);
        setCalls(cl);
      })
      .catch((e) => {
        if (!cancelled) setError(errorText(e, "Müştərilər yüklənə bilmədi."));
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const openNew = () => {
    setForm(emptyForm);
    setEditing("new");
  };

  const openEdit = (c: Customer) => {
    setForm({ phoneNumber: c.phoneNumber, name: c.name ?? "", notes: c.notes ?? "" });
    setEditing(c);
    setViewing(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editing === "new") {
        const created = await createCustomer(tenantId, {
          phoneNumber: form.phoneNumber.trim(),
          name: form.name.trim() || undefined,
          notes: form.notes.trim() || undefined,
        });
        setCustomers((prev) => (prev ? [created, ...prev] : [created]));
      } else if (editing) {
        const updated = await updateCustomer(tenantId, editing.id, {
          phoneNumber: form.phoneNumber.trim(),
          name: form.name.trim() || undefined,
          notes: form.notes.trim() || undefined,
        });
        setCustomers((prev) =>
          prev ? prev.map((c) => (c.id === updated.id ? updated : c)) : prev,
        );
      }
      setRefreshTick((t) => t + 1);
      setEditing(null);
    } catch (e) {
      setError(errorText(e, "Yadda saxlamaq mümkün olmadı."));
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Customer>[] = [
    {
      key: "name",
      header: "Ad",
      cell: (c) => <span className="font-medium text-fg">{c.name || "—"}</span>,
    },
    {
      key: "phoneNumber",
      header: "Nömrə",
      cell: (c) => <span className="text-fg-muted">{c.phoneNumber}</span>,
    },
    {
      key: "callCount",
      header: "Zəng sayı",
      numeric: true,
      cell: (c) => <span className="text-fg-muted">{c.callCount}</span>,
    },
    {
      key: "lastSeenAt",
      header: "Son görülüb",
      cell: (c) => <span className="text-fg-muted">{formatDateTime(c.lastSeenAt)}</span>,
    },
  ];

  if (error && !customers) return <Alert tone="err">{error}</Alert>;
  if (!customers) return null;

  const history = viewing ? calls.filter((c) => c.callerNumber === viewing.phoneNumber) : [];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-fg">Müştərilər</h2>
          <p className="mt-1 text-xs text-fg-muted">
            {customers.length} müştəri · CRM — agentin danışdığı bütün müştərilər
          </p>
        </div>
        <Button size="sm" icon={IconPlus} onClick={openNew}>
          Yeni müştəri
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
        defaultSort="lastSeenAt"
        defaultDirection="desc"
        searchPlaceholder="Ad, nömrə və ya qeyd üzrə axtar…"
        emptyMessage="Hələ müştəri yoxdur. Zəng bitəndə nömrəyə görə avtomatik yaranır."
        resetKey={refreshTick}
        fetchPage={clientPage(customers, matchesCustomer, compareCustomer)}
        onRowClick={(c) => setViewing(c)}
      />

      {viewing && (
        <Modal title={viewing.name || viewing.phoneNumber} onClose={() => setViewing(null)} size="lg">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-fg-muted">{viewing.phoneNumber}</p>
              <Button
                variant="ghost"
                size="sm"
                icon={IconEdit}
                onClick={() => openEdit(viewing)}
              >
                Redaktə et
              </Button>
            </div>

            {viewing.notes && (
              <p className="rounded-md bg-surface-2 px-3 py-2 text-sm text-fg-muted">
                {viewing.notes}
              </p>
            )}

            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-faint">
                Zəng tarixçəsi
              </h3>
              {history.length === 0 ? (
                <p className="text-sm text-fg-faint">Zəng tarixçəsi boşdur.</p>
              ) : (
                <ul className="space-y-2">
                  {history.map((call) => (
                    <li key={call.id} className="rounded-md border border-border/60 px-3 py-2">
                      <p className="text-sm text-fg">
                        {formatDateTime(call.startedAt)} · {formatDuration(call.durationSec)}
                      </p>
                      <p className="text-xs">
                        <StatusText tone={CALL_STATUS_TONE[call.status]}>
                          {CALL_STATUS_LABEL[call.status]}
                        </StatusText>
                        {call.languageDetected ? ` · ${call.languageDetected}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Modal>
      )}

      {editing !== null && (
        <Modal
          title={editing === "new" ? "Yeni müştəri" : "Müştərini redaktə et"}
          onClose={() => setEditing(null)}
        >
          <form onSubmit={submit} className="space-y-4">
            <Field label="Ad">
              <input
                className={inputCls}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Telefon">
              <input
                required
                className={inputCls}
                placeholder="+994 xx xxx xx xx"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              />
            </Field>
            <Field label="Qeyd">
              <textarea
                rows={3}
                className={inputCls}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Field>
            {error && <p className="text-sm text-err">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
                Ləğv et
              </Button>
              <Button type="submit" loading={saving} disabled={!form.phoneNumber.trim()}>
                Yadda saxla
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
