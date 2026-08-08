import { useEffect, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { Link, useNavigate } from "react-router-dom";
import { createTenant, listTenants } from "../api/tenants";
import { getPublicConfig } from "../api/publicConfig";
import type { Tenant, TenantCreateInput } from "../api/types";
import { DataTable, type Column } from "../components/DataTable";
import { IconPlus } from "../components/icons";
import { LanguagePicker, serializeLanguages } from "../components/LanguagePicker";
import {
  btnGhost,
  btnPrimary,
  Field,
  inputCls,
  Modal,
  PageHeader,
  StatusText,
} from "../components/ui";
import { formatDate, formatMoney } from "../lib/format";

const emptyForm: TenantCreateInput = {
  name: "",
  subdomain: "",
  phoneNumber: "",
  greetingText: "",
  workingHours: "",
  handoffNumber: "",
};

function CreateTenantModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<TenantCreateInput>(emptyForm);
  // Dil konfiqurasiyası ayrıca idarə olunur (bax LanguagePicker) - bazada JSON kimi
  // saxlanılan sahəni əl ilə yazdırmaq operatoru bir vergül səhvi ilə agentin dilini
  // tamamilə itirmək riskinə atır.
  const [defLang, setDefLang] = useState("az");
  const [supported, setSupported] = useState<string[]>(["az"]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [domain, setDomain] = useState("");

  useEffect(() => {
    getPublicConfig().then((c) => setDomain(c.panelDomain));
  }, []);

  const toggleLanguage = (code: string) => {
    setSupported((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createTenant({
        name: form.name.trim(),
        subdomain: form.subdomain?.trim() || undefined,
        phoneNumber: form.phoneNumber?.trim() || undefined,
        greetingText: form.greetingText?.trim() || undefined,
        workingHours: form.workingHours?.trim() || undefined,
        handoffNumber: form.handoffNumber?.trim() || undefined,
        languageConfig: serializeLanguages(defLang, supported),
      });
      onCreated();
      onClose();
    } catch (e) {
      // Backend subdomain ucun konkret sebeb qaytarir ("bu unvan artiq istifade olunur",
      // "yalniz kicik latin herfleri..."). Onu udmaq faydasizdir.
      const err = e as AxiosError<{ detail?: string }>;
      setError(err.response?.data?.detail ?? "Biznes yaradıla bilmədi. Məlumatları yoxlayın.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Yeni biznes" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Biznes adı">
          <input
            required
            className={inputCls}
            placeholder="CES"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>

        <Field label="Panel ünvanı">
          <div className="flex items-center gap-2">
            <input
              className={inputCls}
              placeholder="ces"
              value={form.subdomain}
              onChange={(e) =>
                setForm({ ...form, subdomain: e.target.value.toLowerCase() })
              }
            />
            <span className="shrink-0 text-sm text-fg-muted">.{domain}</span>
          </div>
          <p className="mt-1 text-xs text-fg-faint">
            Bu biznesin öz paneli bu ünvanda açılacaq. Kiçik hərf, rəqəm və defis.
            Boş buraxsan panel ünvanı olmur.
          </p>
        </Field>

        <Field label="Telefon nömrəsi">
          <input
            className={inputCls}
            placeholder="+994 xx xxx xx xx"
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
          />
        </Field>

        <Field label="Salamlama mətni">
          <textarea
            rows={2}
            className={inputCls}
            placeholder="Salam, CES-ə xoş gəlmisiniz..."
            value={form.greetingText}
            onChange={(e) => setForm({ ...form, greetingText: e.target.value })}
          />
        </Field>

        <Field label="İş saatları">
          <input
            className={inputCls}
            placeholder="B.e–Cümə 09:00–18:00"
            value={form.workingHours}
            onChange={(e) => setForm({ ...form, workingHours: e.target.value })}
          />
        </Field>

        <Field label="Operatora yönləndirmə nömrəsi">
          <input
            className={inputCls}
            placeholder="+994 xx xxx xx xx"
            value={form.handoffNumber}
            onChange={(e) => setForm({ ...form, handoffNumber: e.target.value })}
          />
        </Field>

        <LanguagePicker
          defLang={defLang}
          supported={supported}
          onChangeDefLang={setDefLang}
          onToggleLanguage={toggleLanguage}
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
            {saving ? "Yaradılır…" : "Yarat"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function TenantsPage() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [domain, setDomain] = useState("");
  // Yeni biznes yaradilanda cedvele "yeniden yukle" siqnali.
  const [reload, setReload] = useState(0);

  useEffect(() => {
    getPublicConfig().then((c) => setDomain(c.panelDomain));
  }, []);

  const columns: Column<Tenant>[] = [
    {
      key: "name",
      header: "Biznes",
      cell: (t) => (
        <Link to={`/tenants/${t.subdomain ?? t.id}`} className="font-medium text-fg hover:underline">
          {t.name}
        </Link>
      ),
    },
    {
      key: "subdomain",
      header: "Panel ünvanı",
      cell: (t) =>
        t.subdomain ? (
          <a
            href={`https://${t.subdomain}.${domain}`}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs text-fg-muted hover:text-fg hover:underline"
          >
            {t.subdomain}.{domain}
          </a>
        ) : (
          <StatusText tone="warn">yoxdur</StatusText>
        ),
    },
    {
      // Vapi-de agent qurulmayibsa bu biznes zeng qebul etmir — siyahida gorunsun.
      header: "Telefon agenti",
      cell: (t) =>
        t.vapiAssistantId ? (
          <StatusText tone="ok">qurulub</StatusText>
        ) : (
          <StatusText tone="err">qurulmayıb</StatusText>
        ),
    },
    {
      key: "phoneNumber",
      header: "Telefon nömrəsi",
      cell: (t) => <span className="text-fg-muted">{t.phoneNumber ?? "—"}</span>,
    },
    {
      key: "monthlyFee",
      header: "Aylıq",
      align: "right",
      numeric: true,
      cell: (t) => <span className="text-fg-muted">{formatMoney(t.monthlyFee)}</span>,
    },
    {
      key: "createdAt",
      header: "Yaradılıb",
      align: "right",
      numeric: true,
      cell: (t) => <span className="text-fg-muted">{formatDate(t.createdAt)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Bizneslər"
        subtitle="Platformadakı bütün müəssisələr"
        actions={
          <button className={btnPrimary} onClick={() => setModalOpen(true)}>
            <IconPlus width={16} height={16} />
            Yeni biznes
          </button>
        }
      />

      <DataTable
        columns={columns}
        rowKey={(t) => t.id}
        defaultSort="name"
        searchPlaceholder="Ad, ünvan və ya nömrə…"
        emptyMessage="Hələ heç bir biznes yoxdur."
        resetKey={reload}
        onRowClick={(t) => navigate(`/tenants/${t.subdomain ?? t.id}`)}
        fetchPage={(state) =>
          listTenants({
            q: state.q || undefined,
            page: state.page,
            size: state.size,
            sort: state.sort,
            direction: state.direction,
          })
        }
      />

      {modalOpen && (
        <CreateTenantModal
          onClose={() => setModalOpen(false)}
          onCreated={() => setReload((n) => n + 1)}
        />
      )}
    </div>
  );
}
