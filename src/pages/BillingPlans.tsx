import { useEffect, useState, type FormEvent } from "react";
import { createBillingPlan, listBillingPlans, updateBillingCatalogPlan, type BillingCatalogPlanInput } from "../api/billing";
import type { BillingCatalogPlan } from "../api/types";
import { clientPage, DataTable, type Column } from "../components/DataTable";
import { IconEdit, IconPlus } from "../components/icons";
import { Button, Field, InlineSpinner, inputCls, Modal, PageHeader, Spinner, StatusText } from "../components/ui";

const empty = (): BillingCatalogPlanInput => ({ name: "", monthlyFee: 0, includedMinutes: 0, overagePerMinute: 0, monthlyMinuteCap: 0, maxConcurrentCalls: 1, dueDays: 15, active: true });
const matches = (p: BillingCatalogPlan, q: string) => p.name.toLowerCase().includes(q);
const compare = (key: string) => (a: BillingCatalogPlan, b: BillingCatalogPlan) => key === "name" ? a.name.localeCompare(b.name) : Number(a[key as keyof BillingCatalogPlan] ?? 0) - Number(b[key as keyof BillingCatalogPlan] ?? 0);

export function BillingPlansPage() {
  const [plans, setPlans] = useState<BillingCatalogPlan[] | null>(null); const [editing, setEditing] = useState<BillingCatalogPlan | null | "new">(null); const [tick, setTick] = useState(0);
  const load = () => listBillingPlans().then(setPlans);
  useEffect(() => { load().catch(() => setPlans([])); }, [tick]);
  const columns: Column<BillingCatalogPlan>[] = [
    { key: "name", header: "Paket", sortable: true, cell: p => <span className="font-medium text-fg">{p.name}</span> },
    { key: "monthlyFee", header: "Aylıq ödəniş", sortable: true, cell: p => `${p.monthlyFee.toFixed(2)} ₼` },
    { key: "includedMinutes", header: "Daxil dəqiqə", sortable: true, cell: p => p.includedMinutes || "—" },
    { key: "overagePerMinute", header: "Aşım", sortable: true, cell: p => `${p.overagePerMinute.toFixed(2)} ₼/dəq` },
    { key: "maxConcurrentCalls", header: "Paralel zəng", sortable: true, cell: p => `${p.maxConcurrentCalls} xətt` },
    { key: "dueDays", header: "Ödəniş müddəti", sortable: true, cell: p => `${p.dueDays} gün` },
    { key: "active", header: "Vəziyyət", cell: p => <StatusText tone={p.active ? "ok" : "neutral"}>{p.active ? "Aktiv" : "Passiv"}</StatusText> },
    { key: "actions", header: "", cell: p => <Button variant="ghost" icon={IconEdit} aria-label={`${p.name} redaktə`} onClick={() => setEditing(p)} /> },
  ];
  return <div className="space-y-6"><PageHeader title="Tariflər" subtitle="Paket, daxil dəqiqə, aşım qiyməti və standart ödəniş müddəti." actions={<Button icon={IconPlus} onClick={() => setEditing("new")}>Yeni paket</Button>} />
    {!plans ? <Spinner /> : <DataTable columns={columns} rowKey={p => p.id} defaultSort="name" resetKey={tick} fetchPage={clientPage(plans, matches, compare)} />}
    {editing && <PlanModal plan={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setTick(x => x + 1); }} />}
  </div>;
}
function PlanModal({ plan, onClose, onSaved }: { plan: BillingCatalogPlan | null; onClose(): void; onSaved(): void }) {
  const [value, setValue] = useState<BillingCatalogPlanInput>(plan ? { name: plan.name, monthlyFee: plan.monthlyFee, includedMinutes: plan.includedMinutes, overagePerMinute: plan.overagePerMinute, monthlyMinuteCap: plan.monthlyMinuteCap, maxConcurrentCalls: plan.maxConcurrentCalls, dueDays: plan.dueDays, active: plan.active } : empty()); const [saving, setSaving] = useState(false); const set = (key: keyof BillingCatalogPlanInput, raw: string | boolean) => setValue(v => ({ ...v, [key]: typeof raw === "boolean" ? raw : key === "name" ? raw : Number(raw) }));
  const submit = async (e: FormEvent) => { e.preventDefault(); setSaving(true); try { plan ? await updateBillingCatalogPlan(plan.id, value) : await createBillingPlan(value); onSaved(); } finally { setSaving(false); } };
  return <Modal title={plan ? "Paketi redaktə et" : "Yeni paket"} onClose={onClose}><form onSubmit={submit} className="space-y-4"><Field label="Paket adı"><input required className={inputCls} value={value.name} onChange={e => set("name", e.target.value)} /></Field><div className="grid grid-cols-2 gap-3"><Field label="Aylıq ödəniş (₼)"><input required min="0" step="0.01" type="number" className={inputCls} value={value.monthlyFee} onChange={e => set("monthlyFee", e.target.value)} /></Field><Field label="Daxil dəqiqə"><input min="0" type="number" className={inputCls} value={value.includedMinutes} onChange={e => set("includedMinutes", e.target.value)} /></Field><Field label="Aşım (₼/dəq)"><input required min="0" step="0.0001" type="number" className={inputCls} value={value.overagePerMinute} onChange={e => set("overagePerMinute", e.target.value)} /></Field><Field label="Paralel zəng limiti"><input required min="1" type="number" className={inputCls} value={value.maxConcurrentCalls} onChange={e => set("maxConcurrentCalls", e.target.value)} /></Field><Field label="Ödəniş müddəti (gün)"><input required min="0" max="365" type="number" className={inputCls} value={value.dueDays} onChange={e => set("dueDays", e.target.value)} /></Field></div><p className="text-xs text-fg-faint">Bu paketdə bir müəssisənin eyni anda AI-nin cavab verə biləcəyi maksimum zəng sayı.</p><label className="flex items-center gap-2 text-sm text-fg"><input type="checkbox" checked={value.active} onChange={e => set("active", e.target.checked)} /> Aktiv paket</label><div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Ləğv et</Button><Button type="submit" disabled={saving}>{saving ? <InlineSpinner /> : "Yadda saxla"}</Button></div></form></Modal>;
}
