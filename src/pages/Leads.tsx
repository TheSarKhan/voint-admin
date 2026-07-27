import { useState, type FormEvent } from "react";
import { listLeads, updateLead } from "../api/leads";
import type { Lead, LeadStatus } from "../api/types";
import { DataTable, type Column } from "../components/DataTable";
import {
  btnGhost,
  btnPrimary,
  Modal,
  PageHeader,
  Select,
  StatusText,
  Textarea,
} from "../components/ui";
import { formatDate } from "../lib/format";

type Tone = "neutral" | "ok" | "warn" | "err";

/**
 * Statuslar nişan/çip icinde yox, sade rengli metn kimi gosterilir — panel dizayn
 * qaydasi budur (bax: components/ui.tsx).
 */
const STATUS: Record<LeadStatus, { label: string; tone: Tone }> = {
  NEW: { label: "yeni", tone: "warn" },
  CONTACTED: { label: "əlaqə saxlanılıb", tone: "neutral" },
  CONVERTED: { label: "müştəri oldu", tone: "ok" },
  REJECTED: { label: "uyğun deyil", tone: "err" },
};

const STATUS_OPTIONS = (Object.keys(STATUS) as LeadStatus[]).map((value) => ({
  value,
  label: STATUS[value].label,
}));

function EditLeadModal({
  lead,
  onClose,
  onSaved,
}: {
  lead: Lead;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [note, setNote] = useState(lead.note ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateLead(lead.id, { status, note: note.trim() || null });
      onSaved();
      onClose();
    } catch {
      setError("Yadda saxlamaq mümkün olmadı.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={lead.company} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-fg-muted">Ad Soyad</dt>
            <dd className="text-fg">{lead.fullName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-fg-muted">Telefon</dt>
            <dd>
              <a href={`tel:${lead.phone}`} className="text-fg hover:underline">
                {lead.phone}
              </a>
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-fg-muted">Email</dt>
            <dd>
              <a href={`mailto:${lead.email}`} className="text-fg hover:underline">
                {lead.email}
              </a>
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-fg-muted">Sahə</dt>
            <dd className="text-fg">{lead.industry ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-fg-muted">Gündəlik zəng</dt>
            <dd className="text-fg">{lead.dailyCallVolume ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-fg-muted">Gəlib</dt>
            <dd className="text-fg">{formatDate(lead.createdAt)}</dd>
          </div>
        </dl>

        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as LeadStatus)}
          options={STATUS_OPTIONS}
        />

        <Textarea
          label="Qeyd"
          rows={3}
          maxLength={4000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          help="Zəng edəndən sonra nə öyrəndin — yalnız admin panelində görünür."
        />

        {error && (
          <p className="rounded-md border border-err/40 bg-err/10 px-3 py-2 text-sm text-err">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className={btnGhost} onClick={onClose}>
            Ləğv et
          </button>
          <button type="submit" disabled={saving} className={btnPrimary}>
            {saving ? "Yadda saxlanılır…" : "Yadda saxla"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function LeadsPage() {
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "">("");
  const [editing, setEditing] = useState<Lead | null>(null);
  const [reload, setReload] = useState(0);

  const columns: Column<Lead>[] = [
    {
      key: "company",
      header: "Şirkət",
      cell: (l) => (
        <button
          onClick={() => setEditing(l)}
          className="text-left font-medium text-fg hover:underline"
        >
          {l.company}
        </button>
      ),
    },
    {
      key: "fullName",
      header: "Əlaqədar şəxs",
      cell: (l) => <span className="text-fg-muted">{l.fullName}</span>,
    },
    {
      header: "Telefon",
      cell: (l) => (
        <a href={`tel:${l.phone}`} className="text-fg-muted hover:text-fg hover:underline">
          {l.phone}
        </a>
      ),
    },
    {
      key: "email",
      header: "Email",
      cell: (l) => (
        <a href={`mailto:${l.email}`} className="text-fg-muted hover:text-fg hover:underline">
          {l.email}
        </a>
      ),
    },
    {
      header: "Sahə",
      cell: (l) => <span className="text-fg-muted">{l.industry ?? "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (l) => (
        <StatusText tone={STATUS[l.status].tone}>{STATUS[l.status].label}</StatusText>
      ),
    },
    {
      key: "createdAt",
      header: "Gəlib",
      align: "right",
      numeric: true,
      cell: (l) => <span className="text-fg-muted">{formatDate(l.createdAt)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Pilot sorğuları"
        subtitle="Landing səhifəsindəki formdan gələn müraciətlər"
      />

      <DataTable
        columns={columns}
        rowKey={(l) => l.id}
        defaultSort="createdAt"
        defaultDirection="desc"
        searchPlaceholder="Şirkət, ad, email və ya nömrə…"
        emptyMessage="Hələ heç bir sorğu gəlməyib."
        resetKey={`${statusFilter}:${reload}`}
        toolbar={
          <Select
            aria-label="Status filtri"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "")}
            options={[{ value: "", label: "Bütün statuslar" }, ...STATUS_OPTIONS]}
            containerClassName="w-52"
          />
        }
        fetchPage={(state) =>
          listLeads({
            q: state.q || undefined,
            status: statusFilter || undefined,
            page: state.page,
            size: state.size,
            sort: state.sort,
            direction: state.direction,
          })
        }
      />

      {editing && (
        <EditLeadModal
          lead={editing}
          onClose={() => setEditing(null)}
          onSaved={() => setReload((n) => n + 1)}
        />
      )}
    </div>
  );
}
