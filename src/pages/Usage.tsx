import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listUsage } from "../api/usage";
import type { UsageReport } from "../api/types";
import {
  Alert,
  Card,
  CardBody,
  CardHeader,
  PageHeader,
  Select,
  Spinner,
  StatCard,
  Table,
  TableContainer,
  TableEmpty,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "../components/ui";
import {
  currentMonth,
  formatMinutes,
  formatMoney,
  formatMonth,
  formatNumber,
  recentMonths,
} from "../lib/format";

/** Marja rengi: mənfi marja gözə çarpmalıdır, çünki o, zərərlə xidmət deməkdir. */
function marginTone(margin: number): string {
  if (margin < 0) return "text-err";
  return "text-fg";
}

export function UsagePage() {
  const [month, setMonth] = useState(currentMonth());
  const [rows, setRows] = useState<UsageReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const months = useMemo(() => recentMonths(12), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listUsage(month)
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch(() => {
        if (!cancelled) setError("İstifadə məlumatı yüklənmədi.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [month]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          invoice: acc.invoice + r.invoiceAzn,
          cost: acc.cost + r.cost.total,
          margin: acc.margin + r.marginAzn,
          minutes: acc.minutes + r.usage.minutes,
          calls: acc.calls + r.usage.calls,
        }),
        { invoice: 0, cost: 0, margin: 0, minutes: 0, calls: 0 },
      ),
    [rows],
  );

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

      {error && <Alert tone="err">{error}</Alert>}

      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Qaimə cəmi"
              value={formatMoney(totals.invoice)}
              hint={`${rows.length} biznes`}
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

          <Card>
            <CardHeader
              title={formatMonth(month)}
              description="Ən böyük qaimədən başlayaraq."
            />
            <CardBody className="p-0">
              <TableContainer>
                <Table>
                  <THead>
                    <TR>
                      <TH>Biznes</TH>
                      <TH className="text-right">Zəng</TH>
                      <TH className="text-right">Dəqiqə</TH>
                      <TH className="text-right">Artıq dəqiqə</TH>
                      <TH className="text-right">Token</TH>
                      <TH className="text-right">Səs (hərf)</TH>
                      <TH className="text-right">Maya</TH>
                      <TH className="text-right">Qaimə</TH>
                      <TH className="text-right">Qazanc</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {rows.length === 0 ? (
                      <TableEmpty
                        colSpan={9}
                        message="Bu ay heç bir biznes qeydə alınmayıb."
                      />
                    ) : (
                      rows.map((r) => (
                        <TR key={r.tenantId}>
                          <TD>
                            <Link
                              to={`/tenants/${r.tenantId}`}
                              className="font-medium text-fg hover:underline"
                            >
                              {r.tenantName}
                            </Link>
                          </TD>
                          <TD className="text-right tabular-nums text-fg-muted">
                            {formatNumber(r.usage.calls)}
                          </TD>
                          <TD className="text-right tabular-nums text-fg-muted">
                            {formatMinutes(r.usage.minutes)}
                          </TD>
                          <TD className="text-right tabular-nums text-fg-muted">
                            {r.plan.overageMinutes > 0
                              ? formatMinutes(r.plan.overageMinutes)
                              : "—"}
                          </TD>
                          <TD className="text-right tabular-nums text-fg-muted">
                            {formatNumber(r.usage.totalTokens)}
                          </TD>
                          <TD className="text-right tabular-nums text-fg-muted">
                            {formatNumber(r.usage.ttsCharacters)}
                          </TD>
                          <TD className="text-right tabular-nums text-fg-muted">
                            {formatMoney(r.cost.total)}
                          </TD>
                          <TD className="text-right font-medium tabular-nums text-fg">
                            {formatMoney(r.invoiceAzn)}
                          </TD>
                          <TD
                            className={`text-right tabular-nums ${marginTone(r.marginAzn)}`}
                          >
                            {formatMoney(r.marginAzn)}
                            {r.marginPercent !== null && (
                              <span className="ml-1 text-xs text-fg-faint">
                                {r.marginPercent}%
                              </span>
                            )}
                          </TD>
                        </TR>
                      ))
                    )}
                  </TBody>
                </Table>
              </TableContainer>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
