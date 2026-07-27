import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { createTenant, listTenants } from "../api/tenants";
import type { Tenant, TenantCreateInput } from "../api/types";
import { IconPlus } from "../components/icons";
import { ProviderStatus } from "../components/ProviderStatus";
import {
  btnGhost,
  btnPrimary,
  Card,
  EmptyState,
  Field,
  inputCls,
  Modal,
  PageHeader,
  Spinner,
} from "../components/ui";
import { formatDate } from "../lib/format";

const emptyForm: TenantCreateInput = {
  name: "",
  phoneNumber: "",
  greetingText: "",
  workingHours: "",
  handoffNumber: "",
  languageConfig: "",
};

function CreateTenantModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (tenant: Tenant) => void;
}) {
  const [form, setForm] = useState<TenantCreateInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const tenant = await createTenant({
        name: form.name.trim(),
        phoneNumber: form.phoneNumber?.trim() || undefined,
        greetingText: form.greetingText?.trim() || undefined,
        workingHours: form.workingHours?.trim() || undefined,
        handoffNumber: form.handoffNumber?.trim() || undefined,
        languageConfig: form.languageConfig?.trim() || undefined,
      });
      onCreated(tenant);
      onClose();
    } catch {
      setError("Biznes yaradıla bilmədi. Məlumatları yoxlayın.");
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

        <Field label="Dil konfiqurasiyası">
          <input
            className={inputCls}
            placeholder='az, ya da {"default":"az","supported":["az","ru","en"]}'
            value={form.languageConfig}
            onChange={(e) => setForm({ ...form, languageConfig: e.target.value })}
          />
        </Field>

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
  const [tenants, setTenants] = useState<Tenant[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listTenants()
      .then((res) => {
        if (!cancelled) setTenants(res);
      })
      .catch(() => {
        if (!cancelled) setError("Bizneslər yüklənə bilmədi.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <PageHeader
        title="Bizneslər"
        subtitle="Platformadakı bütün tenant-ları idarə edin"
        actions={
          <button className={btnPrimary} onClick={() => setModalOpen(true)}>
            <IconPlus width={16} height={16} />
            Yeni biznes
          </button>
        }
      />

      <div className="mb-6">
        <ProviderStatus />
      </div>

      {error && <p className="text-sm text-err">{error}</p>}
      {!error && !tenants && <Spinner />}

      {tenants && tenants.length === 0 && (
        <Card>
          <EmptyState message="Hələ heç bir biznes yoxdur. Yeni biznes əlavə edin." />
        </Card>
      )}

      {tenants && tenants.length > 0 && (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-fg-muted">
                <th className="px-5 py-3 font-medium">Biznes</th>
                <th className="px-5 py-3 font-medium">Telefon nömrəsi</th>
                <th className="px-5 py-3 font-medium">Yaradılıb</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr
                  key={t.id}
                  className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-surface-2/60"
                >
                  <td className="px-5 py-3">
                    <Link to={`/tenants/${t.id}`} className="font-medium text-fg hover:underline">
                      {t.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-fg-muted">{t.phoneNumber ?? "—"}</td>
                  <td className="px-5 py-3 text-fg-muted">{formatDate(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {modalOpen && (
        <CreateTenantModal
          onClose={() => setModalOpen(false)}
          onCreated={(tenant) => setTenants((prev) => [...(prev ?? []), tenant])}
        />
      )}
    </div>
  );
}
