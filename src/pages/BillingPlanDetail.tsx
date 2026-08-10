import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getBillingPlanDetail, updateBillingCatalogPlan } from "../api/billing";
import type { BillingPlanDetail, BillingPlanTenant, QuotaStatus } from "../api/types";
import { BillingPlanModal } from "../components/BillingPlanModal";
import { BarChart } from "../components/charts/BarChart";
import { DonutChart } from "../components/charts/DonutChart";
import { clientPage, DataTable, type Column } from "../components/DataTable";
import { IconArrowLeft, IconEdit } from "../components/icons";
import {
  Alert,
  Button,
  Card,
  InlineSpinner,
  PageHeader,
  Spinner,
  StatCard,
  StatusText,
  Switch,
} from "../components/ui";
import { formatMoney, formatMonthShort } from "../lib/format";

const QUOTA_LABEL: Record<QuotaStatus, string> = {
  OK: "Normal",
  WARNING: "Hədə yaxın",
  BLOCKED: "Bloklanıb",
};

const QUOTA_TONE: Record<QuotaStatus, "ok" | "warn" | "err"> = {
  OK: "ok",
  WARNING: "warn",
  BLOCKED: "err",
};

const QUOTA_COLOR_VAR: Record<QuotaStatus, string> = {
  OK: "--color-ok",
  WARNING: "--color-warn",
  BLOCKED: "--color-err",
};

function matchesTenant(t: BillingPlanTenant, needle: string): boolean {
  return t.name.toLowerCase().includes(needle) || (t.subdomain ?? "").toLowerCase().includes(needle);
}

function compareTenant(key: string): (a: BillingPlanTenant, b: BillingPlanTenant) => number {
  return (a, b) => {
    switch (key) {
      case "name":
        return a.name.localeCompare(b.name);
      case "quotaStatus":
        return a.quotaStatus.localeCompare(b.quotaStatus);
      case "currentMonthInvoiceAzn":
        return a.currentMonthInvoiceAzn - b.currentMonthInvoiceAzn;
      case "currentMonthCalls":
        return a.currentMonthCalls - b.currentMonthCalls;
      default:
        return 0;
    }
  };
}

export function BillingPlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<BillingPlanDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const load = () =>
    id
      ? getBillingPlanDetail(id)
          .then(setDetail)
          .catch(() => setError("Paket tapılmadı."))
      : Promise.resolve();

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const toggleActive = async () => {
    if (!detail || !id) return;
    setToggling(true);
    try {
      const p = detail.plan;
      await updateBillingCatalogPlan(id, {
        name: p.name,
        monthlyFee: p.monthlyFee,
        includedMinutes: p.includedMinutes,
        overagePerMinute: p.overagePerMinute,
        monthlyMinuteCap: p.monthlyMinuteCap,
        maxConcurrentCalls: p.maxConcurrentCalls,
        dueDays: p.dueDays,
        active: !p.active,
      });
      await load();
    } finally {
      setToggling(false);
    }
  };

  if (error) return <Alert tone="err">{error}</Alert>;
  if (!detail) return <Spinner />;

  const { plan } = detail;

  const columns: Column<BillingPlanTenant>[] = [
    {
      key: "name",
      header: "Müəssisə",
      cell: (t) => <span className="font-medium text-fg">{t.name}</span>,
    },
    {
      key: "quotaStatus",
      header: "Kvota",
      cell: (t) => <StatusText tone={QUOTA_TONE[t.quotaStatus]}>{QUOTA_LABEL[t.quotaStatus]}</StatusText>,
    },
    {
      key: "currentMonthCalls",
      header: "Bu ay zəng",
      numeric: true,
      cell: (t) => <span className="text-fg-muted">{t.currentMonthCalls}</span>,
    },
    {
      key: "currentMonthInvoiceAzn",
      header: "Bu ay qaimə",
      numeric: true,
      cell: (t) => <span className="text-fg-muted">{formatMoney(t.currentMonthInvoiceAzn)}</span>,
    },
  ];

  return (
    <div>
      <Link
        to="/billing-plans"
        className="mb-4 inline-flex items-center gap-2 text-sm text-fg-muted transition-colors hover:text-fg"
      >
        <IconArrowLeft width={14} height={14} />
        Tariflərə qayıt
      </Link>

      <PageHeader
        title={plan.name}
        subtitle={`${formatMoney(plan.monthlyFee)}/ay · ${plan.includedMinutes || 0} dəq daxil · ${plan.maxConcurrentCalls} paralel zəng`}
        actions={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={plan.active} disabled={toggling} onChange={toggleActive} aria-label="Paket aktiv/passiv" />
              <span className="text-sm text-fg-muted">{plan.active ? "Aktiv" : "Passiv"}</span>
              {toggling && <InlineSpinner />}
            </div>
            <Button variant="secondary" icon={IconEdit} onClick={() => setEditing(true)}>
              Redaktə et
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Bu paketdə müəssisə" value={String(detail.tenantCount)} />
        <StatCard
          label="Bu ay bu paketdən gəlir"
          value={formatMoney(detail.currentMonthRevenueAzn)}
        />
        <StatCard
          label="Bu ay ümumi zəng"
          value={String(detail.currentMonthCalls)}
          hint={`${detail.currentMonthMinutes.toFixed(0)} dəqiqə`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Card className="p-6">
          <h2 className="mb-6 text-sm font-medium text-fg">Kvota vəziyyəti</h2>
          {detail.tenantCount === 0 ? (
            <p className="text-sm text-fg-faint">Bu paketdə hələ müəssisə yoxdur.</p>
          ) : (
            <DonutChart
              centerLabel={`${detail.tenantCount} müəssisə`}
              segments={[
                { label: QUOTA_LABEL.OK, value: detail.quota.ok, colorVar: QUOTA_COLOR_VAR.OK },
                { label: QUOTA_LABEL.WARNING, value: detail.quota.warning, colorVar: QUOTA_COLOR_VAR.WARNING },
                { label: QUOTA_LABEL.BLOCKED, value: detail.quota.blocked, colorVar: QUOTA_COLOR_VAR.BLOCKED },
              ]}
            />
          )}
        </Card>

        <Card className="p-6">
          <h2 className="mb-6 text-sm font-medium text-fg">Gəlir trendi (son 12 ay)</h2>
          <BarChart
            data={detail.revenueTrend.map((m) => ({
              label: formatMonthShort(m.month),
              value: m.revenueAzn,
              tooltip: `${m.month}: ${formatMoney(m.revenueAzn)}`,
            }))}
            formatValue={(v) => formatMoney(v)}
          />
        </Card>
      </div>

      <div className="mt-6">
        <h2 className="mb-4 text-sm font-semibold text-fg">Bu paketi istifadə edən müəssisələr</h2>
        <DataTable
          columns={columns}
          rowKey={(t) => t.id}
          defaultSort="name"
          searchPlaceholder="Müəssisə adı üzrə axtar…"
          emptyMessage="Bu paketdə hələ müəssisə yoxdur."
          resetKey={refreshTick}
          fetchPage={clientPage(detail.tenants, matchesTenant, compareTenant)}
          onRowClick={(t) => navigate(`/tenants/${t.subdomain ?? t.id}`)}
        />
      </div>

      {editing && (
        <BillingPlanModal
          plan={plan}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            load().then(() => setRefreshTick((x) => x + 1));
          }}
        />
      )}
    </div>
  );
}
