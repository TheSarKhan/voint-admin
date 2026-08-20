import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listBillingPlans, updateBillingCatalogPlan, type BillingCatalogPlanInput } from "../api/billing";
import type { BillingCatalogPlan } from "../api/types";
import { BillingPlanModal } from "../components/BillingPlanModal";
import { clientPage, DataTable, type Column } from "../components/DataTable";
import { IconEdit, IconPlus } from "../components/icons";
import { Button, InlineSpinner, PageHeader, Spinner, Switch } from "../components/ui";

const matches = (p: BillingCatalogPlan, q: string) => p.name.toLowerCase().includes(q);
const compare = (key: string) => (a: BillingCatalogPlan, b: BillingCatalogPlan) => key === "name" ? a.name.localeCompare(b.name) : Number(a[key as keyof BillingCatalogPlan] ?? 0) - Number(b[key as keyof BillingCatalogPlan] ?? 0);
/** PUT tam paket gövdəsi gözləyir - toggle da eyni endpoint-i, sadəcə tək sahə dəyişmiş halda çağırır. */
const asInput = (p: BillingCatalogPlan): BillingCatalogPlanInput => ({ name: p.name, monthlyFee: p.monthlyFee, includedMinutes: p.includedMinutes, overagePerMinute: p.overagePerMinute, monthlyMinuteCap: p.monthlyMinuteCap, maxConcurrentCalls: p.maxConcurrentCalls, dueDays: p.dueDays, active: p.active });

export function BillingPlansPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<BillingCatalogPlan[] | null>(null); const [editing, setEditing] = useState<BillingCatalogPlan | null | "new">(null); const [tick, setTick] = useState(0);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const load = () => listBillingPlans().then(setPlans);
  useEffect(() => { load().catch(() => setPlans([])); }, [tick]);

  const toggleActive = async (p: BillingCatalogPlan) => {
    setTogglingId(p.id);
    try { await updateBillingCatalogPlan(p.id, { ...asInput(p), active: !p.active }); await load(); setTick(x => x + 1); }
    finally { setTogglingId(null); }
  };

  const columns: Column<BillingCatalogPlan>[] = [
    { key: "name", header: "Paket", cell: p => <span className="font-medium text-fg">{p.name}</span> },
    { key: "monthlyFee", header: "Aylıq ödəniş", cell: p => `${p.monthlyFee.toFixed(2)} ₼` },
    { key: "includedMinutes", header: "Daxil dəqiqə", cell: p => p.includedMinutes || "—" },
    { key: "overagePerMinute", header: "Aşım", cell: p => `${p.overagePerMinute.toFixed(2)} ₼/dəq` },
    { key: "maxConcurrentCalls", header: "Paralel zəng", cell: p => `${p.maxConcurrentCalls} xətt` },
    { key: "dueDays", header: "Ödəniş müddəti", cell: p => `${p.dueDays} gün` },
    {
      key: "active", header: "Aktiv", cell: p => (
        <div className="flex items-center gap-2">
          <Switch checked={p.active} disabled={togglingId === p.id} onChange={() => toggleActive(p)} aria-label={`${p.name} aktiv/passiv`} />
          {togglingId === p.id && <InlineSpinner />}
        </div>
      )
    },
    { key: "actions", header: "", cell: p => <Button variant="ghost" icon={IconEdit} aria-label={`${p.name} redaktə`} onClick={() => setEditing(p)} /> },
  ];
  return <div className="space-y-6"><PageHeader title="Tariflər" subtitle="Paket, daxil dəqiqə, aşım qiyməti və standart ödəniş müddəti." actions={<Button icon={IconPlus} onClick={() => setEditing("new")}>Yeni paket</Button>} />
    {!plans ? <Spinner /> : <DataTable columns={columns} rowKey={p => p.id} defaultSort="name" resetKey={tick} fetchPage={clientPage(plans, matches, compare)} onRowClick={p => navigate(`/billing-plans/${p.id}`)} />}
    {editing && <BillingPlanModal plan={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load().finally(() => setTick(x => x + 1)); }} />}
  </div>;
}
