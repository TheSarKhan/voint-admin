import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboard } from "../api/dashboard";
import type { DashboardData, DashboardTenantMargin } from "../api/types";
import { IconArrowRight } from "../components/icons";
import { ProviderStatus } from "../components/ProviderStatus";
import {
  Alert,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  Spinner,
  StatCard,
  StatusText,
  Table,
  TableContainer,
  TableEmpty,
  TBody,
  TD,
  TH,
  THead,
  TR,
  type StatusTone,
} from "../components/ui";
import {
  formatDate,
  formatDayShort,
  formatDateTime,
  formatDuration,
  formatMoney,
  formatNumber,
} from "../lib/format";
import { useLivePolling } from "../lib/useLivePolling";
import type { CallStatus } from "../api/types";

const STATUS_LABEL: Record<CallStatus, string> = {
  ONGOING: "Davam edir",
  RESOLVED: "Həll olunub",
  HANDOFF: "Operatora ötürülüb",
};

const STATUS_TONE: Record<CallStatus, StatusTone> = {
  ONGOING: "neutral",
  RESOLVED: "ok",
  HANDOFF: "warn",
};

/**
 * Platforma boyu son 30 günün zəng sayı — bir seriya, ona görə leqend yoxdur (başlıq kifayətdir).
 *
 * Hər gün üçün ayrıca dəyər yazmaq (30 rəqəm) qarışıqlıq olardı, ona görə say yalnız hover-də
 * görünür (mövcud müəssisə-daxili qrafiklə eyni naxış). Gün etiketi də yalnız hər 5-də bir
 * göstərilir — 30 daxil "dd.mm" yazısı hər sütunda olsa qonşu sütunlarla üst-üstə düşür.
 */
function CallsTrendChart({ data }: { data: DashboardData["callsByDay"] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex h-40 items-end gap-[3px]">
      {data.map((d, i) => {
        const h = Math.max((d.count / max) * 100, 4);
        const showLabel = i === 0 || i === data.length - 1 || i % 5 === 0;
        return (
          <div key={d.date} className="group flex flex-1 flex-col items-center gap-1.5">
            <span className="text-[11px] text-fg-muted opacity-0 transition-opacity group-hover:opacity-100">
              {d.count}
            </span>
            <div
              className="w-full rounded-t-sm bg-border-strong transition-colors group-hover:bg-fg-muted"
              style={{ height: `${h}%` }}
              title={`${formatDate(d.date)}: ${d.count} zəng`}
            />
            <span className={`text-[10px] text-fg-faint ${showLabel ? "" : "invisible"}`}>
              {formatDayShort(d.date)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TopTenantsCard({ tenants }: { tenants: DashboardTenantMargin[] }) {
  return (
    <Card>
      <CardHeader
        title="Ən böyük müəssisələr"
        description="Bu ay, qaiməyə görə"
      />
      {tenants.length === 0 ? (
        <EmptyState message="Bu ay heç bir müəssisəyə qaimə çıxarılmayıb." />
      ) : (
        <TableContainer>
          <Table>
            <THead>
              <TH>Müəssisə</TH>
              <TH className="text-right">Zəng</TH>
              <TH className="text-right">Qaimə</TH>
              <TH className="text-right">Marj</TH>
            </THead>
            <TBody>
              {tenants.map((t) => (
                <TR key={t.tenantId}>
                  <TD>
                    <Link
                      to={`/tenants/${t.tenantSubdomain ?? t.tenantId}`}
                      className="font-medium text-fg hover:underline"
                    >
                      {t.tenantName}
                    </Link>
                  </TD>
                  <TD className="whitespace-nowrap text-right tabular-nums text-fg-muted">
                    {formatNumber(t.calls)}
                  </TD>
                  <TD className="whitespace-nowrap text-right tabular-nums text-fg-muted">
                    {formatMoney(t.invoiceAzn)}
                  </TD>
                  <TD className="whitespace-nowrap text-right tabular-nums">
                    <span className={t.marginAzn < 0 ? "text-err" : "text-fg-muted"}>
                      {formatMoney(t.marginAzn)}
                    </span>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableContainer>
      )}
      <div className="border-t border-border px-5 py-3">
        <Link
          to="/usage"
          className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg"
        >
          Bütün müəssisələr
          <IconArrowRight width={14} height={14} />
        </Link>
      </div>
    </Card>
  );
}

function RecentCallsCard({ calls }: { calls: DashboardData["recentCalls"] }) {
  return (
    <Card>
      <CardHeader title="Son zənglər" description="Bütün müəssisələr üzrə" />
      {calls.length === 0 ? (
        <EmptyState message="Hələ zəng qeydə alınmayıb." />
      ) : (
        <TableContainer>
          <Table>
            <THead>
              <TH>Müəssisə</TH>
              <TH>Nömrə</TH>
              <TH>Tarix</TH>
              <TH className="text-right">Müddət</TH>
              <TH>Vəziyyət</TH>
            </THead>
            <TBody>
              {calls.map((c) => (
                <TR key={c.id}>
                  <TD>
                    <Link
                      to={`/tenants/${c.tenantSubdomain ?? c.tenantId}/calls/${c.id}`}
                      className="font-medium text-fg hover:underline"
                    >
                      {c.tenantName}
                    </Link>
                  </TD>
                  <TD className="whitespace-nowrap text-fg-muted">
                    {c.callerNumber || "—"}
                  </TD>
                  <TD className="whitespace-nowrap text-fg-muted">
                    {formatDateTime(c.startedAt)}
                  </TD>
                  <TD className="whitespace-nowrap text-right tabular-nums text-fg-muted">
                    {formatDuration(c.durationSeconds ?? 0)}
                  </TD>
                  <TD>
                    <StatusText tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</StatusText>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableContainer>
      )}
    </Card>
  );
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    getDashboard()
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch(() => setError("Məlumat yüklənə bilmədi."));
  }, []);

  // Canlı: səhifə açıq qalanda hər dəqiqə təzələnir, arxa fondakı tab soruşmur
  // (bax lib/useLivePolling.ts).
  useLivePolling(load, 60_000);

  if (error && !data) return <Alert tone="err">{error}</Alert>;
  if (!data) return <Spinner />;

  return (
    <div>
      <PageHeader title="Ümumi baxış" subtitle="Platforma üzrə bugünkü vəziyyət" />

      {error && (
        <div className="mb-4">
          <Alert tone="err">{error}</Alert>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Aktiv müəssisə" value={formatNumber(data.tenantCount)} />
        <StatCard label="Bugünkü zəng" value={formatNumber(data.callsToday)} />
        <StatCard label="Bu ay zəng" value={formatNumber(data.callsThisMonth)} />
        <StatCard
          label="Gözləyən təsdiq"
          value={formatNumber(data.pendingApprovals)}
          hint={data.pendingApprovals > 0 ? "baxılmalıdır" : "hamısı həll olunub"}
        />
        <StatCard
          label="Açıq sual"
          value={formatNumber(data.openQuestions)}
          hint="bilik bazasında boşluq"
        />
        <StatCard label="Yeni sorğu" value={formatNumber(data.newLeads)} hint="pilot formundan" />
      </div>

      <p className="mb-2 mt-7 text-xs font-medium uppercase tracking-wide text-fg-faint">
        Maliyyə · bu ay
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Qaimə" value={formatMoney(data.invoiceAzn)} />
        <StatCard label="Maya" value={formatMoney(data.costAzn)} hint="Provayder xərcləri" />
        <StatCard
          label="Marj"
          value={formatMoney(data.marginAzn)}
          hint={
            (data.marginPercent !== null ? `%${data.marginPercent.toFixed(1)} · ` : "") +
            "yalnız provayder xərcindən sonra"
          }
        />
      </div>

      <div className="mt-6">
        <ProviderStatus />
      </div>

      <Card className="mt-6 p-6">
        <h2 className="mb-6 text-sm font-medium text-fg">Zəng trendi (son 30 gün)</h2>
        {data.callsByDay.some((d) => d.count > 0) ? (
          <CallsTrendChart data={data.callsByDay} />
        ) : (
          <p className="text-sm text-fg-faint">Bu dövrdə zəng qeydə alınmayıb.</p>
        )}
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <RecentCallsCard calls={data.recentCalls} />
        <TopTenantsCard tenants={data.topTenants} />
      </div>
    </div>
  );
}
