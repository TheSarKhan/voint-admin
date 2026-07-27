import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listUsage } from "../api/usage";
import type { UsageReport } from "../api/types";
import { DataTable, type Column } from "../components/DataTable";
import { PageHeader, Select, StatCard } from "../components/ui";
import {
  currentMonth,
  formatMinutes,
  formatMoney,
  formatMonth,
  formatNumber,
  recentMonths,
} from "../lib/format";

/** Mənfi marja gözə çarpmalıdır — o, zərərlə xidmət deməkdir. */
function marginClass(margin: number): string {
  return margin < 0 ? "text-err" : "text-fg";
}

export function UsagePage() {
  const [month, setMonth] = useState(currentMonth());
  const months = useMemo(() => recentMonths(12), []);

  // Ustdeki dord reqem BUTUN bizneslerin cemidir, cari sehifenin yox — ona gore
  // ayrica, sehifelenmemis sorgu ile alinir. Eks halda "qaime cemi" sehife
  // deyisdikce deyiserdi ki, bu, sadece yanlisdir.
  const [totals, setTotals] = useState({
    invoice: 0,
    cost: 0,
    margin: 0,
    minutes: 0,
    calls: 0,
    tenants: 0,
  });

  useEffect(() => {
    let cancelled = false;
    listUsage({ month, size: 200 })
      .then((res) => {
        if (cancelled) return;
        setTotals(
          res.content.reduce(
            (acc, r) => ({
              invoice: acc.invoice + r.invoiceAzn,
              cost: acc.cost + r.cost.total,
              margin: acc.margin + r.marginAzn,
              minutes: acc.minutes + r.usage.minutes,
              calls: acc.calls + r.usage.calls,
              tenants: res.totalElements,
            }),
            { invoice: 0, cost: 0, margin: 0, minutes: 0, calls: 0, tenants: 0 },
          ),
        );
      })
      .catch(() => {
        /* cedvel onsuz da oz xetasini gosterir */
      });
    return () => {
      cancelled = true;
    };
  }, [month]);

  const columns: Column<UsageReport>[] = [
    {
      key: "tenantName",
      header: "Biznes",
      cell: (r) => (
        <Link
          to={`/tenants/${r.tenantId}`}
          className="font-medium text-fg hover:underline"
        >
          {r.tenantName}
        </Link>
      ),
    },
    {
      key: "calls",
      header: "Zəng",
      align: "right",
      numeric: true,
      cell: (r) => <span className="text-fg-muted">{formatNumber(r.usage.calls)}</span>,
    },
    {
      key: "minutes",
      header: "Dəqiqə",
      align: "right",
      numeric: true,
      cell: (r) => <span className="text-fg-muted">{formatMinutes(r.usage.minutes)}</span>,
    },
    {
      header: "Artıq dəqiqə",
      align: "right",
      numeric: true,
      cell: (r) => (
        <span className="text-fg-muted">
          {r.plan.overageMinutes > 0 ? formatMinutes(r.plan.overageMinutes) : "—"}
        </span>
      ),
    },
    {
      key: "totalTokens",
      header: "Token",
      align: "right",
      numeric: true,
      cell: (r) => <span className="text-fg-muted">{formatNumber(r.usage.totalTokens)}</span>,
    },
    {
      key: "ttsCharacters",
      header: "Səs (hərf)",
      align: "right",
      numeric: true,
      cell: (r) => (
        <span className="text-fg-muted">{formatNumber(r.usage.ttsCharacters)}</span>
      ),
    },
    {
      key: "cost",
      header: "Maya",
      align: "right",
      numeric: true,
      cell: (r) => <span className="text-fg-muted">{formatMoney(r.cost.total)}</span>,
    },
    {
      key: "invoice",
      header: "Qaimə",
      align: "right",
      numeric: true,
      cell: (r) => <span className="font-medium text-fg">{formatMoney(r.invoiceAzn)}</span>,
    },
    {
      key: "margin",
      header: "Qazanc",
      align: "right",
      numeric: true,
      cell: (r) => (
        <span className={marginClass(r.marginAzn)}>
          {formatMoney(r.marginAzn)}
          {r.marginPercent !== null && (
            <span className="ml-1 text-xs text-fg-faint">{r.marginPercent}%</span>
          )}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="İstifadə və hesablaşma"
        subtitle="Hər biznesin nə qədər istifadə etdiyi, bunun bizə nəyə başa gəldiyi və nə qədər ödəməli olduğu."
        actions={
          <Select
            aria-label="Ay"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            options={months.map((m) => ({ value: m, label: formatMonth(m) }))}
            containerClassName="w-44"
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Qaimə cəmi"
          value={formatMoney(totals.invoice)}
          hint={`${totals.tenants} biznes`}
        />
        <StatCard
          label="Maya dəyəri"
          value={formatMoney(totals.cost)}
          hint="Provayderlərə ödədiyimiz"
        />
        <StatCard
          label="Qazanc"
          value={formatMoney(totals.margin)}
          hint={
            totals.invoice > 0
              ? `${Math.round((totals.margin / totals.invoice) * 100)}% marja`
              : "Hələ hesab yoxdur"
          }
        />
        <StatCard
          label="Danışıq"
          value={formatMinutes(totals.minutes)}
          hint={`${formatNumber(totals.calls)} zəng`}
        />
      </div>

      <DataTable
        columns={columns}
        rowKey={(r) => r.tenantId}
        defaultSort="invoice"
        defaultDirection="desc"
        searchable={false}
        emptyMessage="Bu ay heç bir biznes qeydə alınmayıb."
        resetKey={month}
        fetchPage={(state) =>
          listUsage({
            month,
            page: state.page,
            size: state.size,
            sort: state.sort,
            direction: state.direction,
          })
        }
      />
    </div>
  );
}
