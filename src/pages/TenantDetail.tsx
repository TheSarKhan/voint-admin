import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTenantAnalytics } from "../api/analytics";
import { getTenant } from "../api/tenants";
import type { AnalyticsOverview, Tenant } from "../api/types";
import { BillingSection } from "../components/BillingSection";
import { ConfigTab } from "../components/ConfigTab";
import { RolesManager } from "../components/RolesManager";
import { UsersTab } from "../components/UsersTab";
import { VapiStatus } from "../components/VapiStatus";
import { IconArrowLeft } from "../components/icons";
import { StatCard } from "../components/StatCard";
import { Card, PageHeader, Spinner, Tabs } from "../components/ui";
import {
  formatDate,
  formatDayShort,
  formatDuration,
  formatPercent,
} from "../lib/format";

function CallsBarChart({ data }: { data: AnalyticsOverview["callsByDay"] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex h-48 items-end gap-3">
      {data.map((d) => {
        const h = Math.max((d.count / max) * 100, 4);
        return (
          <div key={d.date} className="group flex flex-1 flex-col items-center gap-2">
            <span className="text-xs text-fg-muted opacity-0 transition-opacity group-hover:opacity-100">
              {d.count}
            </span>
            <div
              className="w-full rounded-t-sm bg-border-strong transition-colors group-hover:bg-fg-muted"
              style={{ height: `${h}%` }}
              title={`${formatDate(d.date)}: ${d.count} zəng`}
            />
            <span className="text-[11px] text-fg-faint">{formatDayShort(d.date)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function TenantDetailPage() {
  // Unvanda subdomain ola biler (/tenants/texnika) ve ya UUID — backend ikisini de tanіyіr.
  const { tenantKey } = useParams<{ tenantKey: string }>();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Tek uzun sehife artiq tasimir: statistika, konfiqurasiya, istifadeciler,
  // hesablasma ve zengler ayri-ayri isler — hamisini alt-alta yigmaq axtarmagi cetinlesdirir.
  const [tab, setTab] = useState("umumi");

  useEffect(() => {
    if (!tenantKey) return;
    let cancelled = false;
    // Evvelce muessiseni tap, sonra QALAN sorgulari onun HEQIQI id-si ile ver:
    // analitika endpoint-i subdomain yox, UUID gozleyir.
    getTenant(tenantKey)
      .then(async (t) => {
        if (cancelled) return;
        setTenant(t);
        const a = await getTenantAnalytics(t.id);
        if (!cancelled) setAnalytics(a);
      })
      .catch(() => {
        if (!cancelled) setError("Biznes məlumatları yüklənə bilmədi.");
      });
    return () => {
      cancelled = true;
    };
  }, [tenantKey]);

  if (error) return <p className="text-sm text-err">{error}</p>;
  if (!tenant || !analytics) return <Spinner />;

  return (
    <div>
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-2 text-sm text-fg-muted transition-colors hover:text-fg"
      >
        <IconArrowLeft width={14} height={14} />
        Bizneslərə qayıt
      </Link>

      <PageHeader
        title={tenant.name}
        subtitle={`${tenant.phoneNumber ?? "Telefon nömrəsi yoxdur"} · Yaradılıb: ${formatDate(tenant.createdAt)}`}
      />

      <Tabs
        className="mb-6"
        value={tab}
        onChange={setTab}
        items={[
          { value: "umumi", label: "Ümumi" },
          { value: "istifadeciler", label: "İstifadəçilər" },
          { value: "rollar", label: "Rollar" },
          { value: "hesablasma", label: "Hesablaşma" },
          { value: "konfiqurasiya", label: "Konfiqurasiya" },
        ]}
      />

      {tab === "umumi" && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Ümumi zəng" value={String(analytics.totalCalls)} hint="Son 30 gün" />
            <StatCard
              label="Həll olunma faizi"
              value={formatPercent(analytics.resolutionRate)}
              hint="Agent tərəfindən həll edilən"
            />
            <StatCard
              label="Rezervasiya"
              value={String(analytics.reservationCount)}
              hint="Agent tərəfindən toplanan"
            />
            <StatCard
              label="Orta müddət"
              value={formatDuration(analytics.avgDurationSec)}
              hint="dəqiqə:saniyə"
            />
          </div>

          <Card className="mt-6 p-6">
            <h2 className="mb-6 text-sm font-medium text-fg">Günlük zəng sayı (son 7 gün)</h2>
            {analytics.callsByDay.length > 0 ? (
              <CallsBarChart data={analytics.callsByDay} />
            ) : (
              <p className="text-sm text-fg-faint">Hələ zəng məlumatı yoxdur.</p>
            )}
          </Card>

          <VapiStatus tenant={tenant} onSynced={setTenant} />
        </>
      )}

      {tab === "istifadeciler" && <UsersTab tenantId={tenant.id} />}

      {tab === "rollar" && <RolesManager key={tenant.id} tenantId={tenant.id} />}

      {tab === "hesablasma" && (
        <BillingSection tenant={tenant} onPlanSaved={setTenant} />
      )}

      {tab === "konfiqurasiya" && (
        // key: bir muessiseden digerine kecende forma kohne deyerlerle qalmasin.
        <ConfigTab key={tenant.id} tenant={tenant} onSaved={setTenant} />
      )}
    </div>
  );
}
