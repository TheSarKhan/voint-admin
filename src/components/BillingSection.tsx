import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { getTenantUsage, updateBillingPlan } from "../api/usage";
import type { Tenant, UsageReport } from "../api/types";
import { IconDocument } from "./icons";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  Spinner,
} from "./ui";
import {
  currentMonth,
  formatMinutes,
  formatMoney,
  formatMonth,
  formatNumber,
  recentMonths,
} from "../lib/format";

/** Bir setir: sol terefde ad, sag terefde reqem. */
function Row({
  label,
  value,
  hint,
  strong = false,
}: {
  label: string;
  value: string;
  hint?: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <span className={strong ? "text-sm font-medium text-fg" : "text-sm text-fg-muted"}>
        {label}
        {hint && <span className="ml-1.5 text-xs text-fg-faint">{hint}</span>}
      </span>
      <span
        className={
          strong
            ? "text-sm font-semibold tabular-nums text-fg"
            : "text-sm tabular-nums text-fg-muted"
        }
      >
        {value}
      </span>
    </div>
  );
}

export function BillingSection({
  tenant,
  onPlanSaved,
}: {
  tenant: Tenant;
  onPlanSaved: (updated: Tenant) => void;
}) {
  const [month, setMonth] = useState(currentMonth());
  const [report, setReport] = useState<UsageReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const months = useMemo(() => recentMonths(12), []);

  // Plan formasi
  const [monthlyFee, setMonthlyFee] = useState(String(tenant.monthlyFee ?? 0));
  const [includedMinutes, setIncludedMinutes] = useState(
    String(tenant.includedMinutes ?? 0),
  );
  const [overagePerMinute, setOveragePerMinute] = useState(
    String(tenant.overagePerMinute ?? 0),
  );
  const [minuteCap, setMinuteCap] = useState(String(tenant.monthlyMinuteCap ?? 0));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getTenantUsage(tenant.id, month)
      .then((r) => {
        if (!cancelled) setReport(r);
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
  }, [tenant.id, month]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const updated = await updateBillingPlan(tenant.id, {
        monthlyFee: Number(monthlyFee),
        includedMinutes: Number(includedMinutes),
        overagePerMinute: Number(overagePerMinute),
        monthlyMinuteCap: Number(minuteCap),
      });
      onPlanSaved(updated);
      setSaved(true);
      // Plan deyisdi -> qaime mebleği de deyisir, yeniden yukle.
      const refreshed = await getTenantUsage(tenant.id, month);
      setReport(refreshed);
    } catch {
      setSaveError("Plan yadda saxlanmadı.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader
        title="İstifadə və hesablaşma"
        description="Ölçülmüş istifadə — təxmin deyil. Dəqiqələr zəng qeydlərindən, token və hərflər hər cavabdan yığılır."
        actions={
          <div className="flex items-center gap-2">
            <Select
              aria-label="Ay"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              options={months.map((m) => ({ value: m, label: formatMonth(m) }))}
              containerClassName="w-40"
            />
            <Link to={`/tenants/${tenant.subdomain ?? tenant.id}/invoice?month=${month}`}>
              <Button variant="secondary" size="sm" icon={IconDocument}>
                Qaimə
              </Button>
            </Link>
          </div>
        }
      />
      <CardBody>
        {error && <Alert tone="err">{error}</Alert>}
        {loading || !report ? (
          <Spinner />
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Sol: istifade ve maya */}
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-fg-muted">
                İstifadə
              </p>
              <div className="divide-y divide-border/60">
                <Row label="Zəng sayı" value={formatNumber(report.usage.calls)} />
                <Row
                  label="Ümumi danışıq"
                  value={formatMinutes(report.usage.minutes)}
                />
                <Row
                  label="Səsə çevrilən hərf"
                  value={formatNumber(report.usage.ttsCharacters)}
                  hint="ən böyük xərc"
                />
                <Row
                  label="AI token"
                  value={formatNumber(report.usage.totalTokens)}
                  hint={`${formatNumber(report.usage.promptTokens)} giriş / ${formatNumber(
                    report.usage.completionTokens,
                  )} çıxış`}
                />
              </div>

              <p className="mb-1 mt-6 text-xs font-medium uppercase tracking-wide text-fg-muted">
                Maya dəyəri
              </p>
              <div className="divide-y divide-border/60">
                <Row label="Səs (ElevenLabs)" value={formatMoney(report.cost.tts)} />
                <Row label="AI (Gemini)" value={formatMoney(report.cost.llm)} />
                <Row label="Vapi platforma" value={formatMoney(report.cost.vapi)} />
                <Row label="Telefoniya" value={formatMoney(report.cost.telephony)} />
                <Row label="Nitq tanıma (Soniox)" value={formatMoney(report.cost.stt)} />
                <Row label="Cəmi" value={formatMoney(report.cost.total)} strong />
              </div>
            </div>

            {/* Sag: hesab ve plan */}
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-fg-muted">
                Hesab
              </p>
              <div className="divide-y divide-border/60">
                <Row
                  label="Aylıq abunə"
                  value={formatMoney(report.plan.monthlyFee)}
                  hint={`${formatNumber(report.plan.includedMinutes)} dəq daxil`}
                />
                <Row
                  label="Artıq dəqiqə"
                  value={
                    report.plan.overageMinutes > 0
                      ? formatMoney(
                          report.plan.overageMinutes * report.plan.overagePerMinute,
                        )
                      : "—"
                  }
                  hint={
                    report.plan.overageMinutes > 0
                      ? `${formatMinutes(report.plan.overageMinutes)} × ${formatMoney(
                          report.plan.overagePerMinute,
                        )}`
                      : undefined
                  }
                />
                <Row
                  label="Aylıq tavan"
                  value={
                    report.plan.monthlyMinuteCap > 0
                      ? `${formatNumber(report.plan.monthlyMinuteCap)} dəq · ${report.plan.capPercentUsed}%`
                      : "limitsiz"
                  }
                  hint={report.plan.monthlyMinuteCap > 0 ? "hədd" : undefined}
                />
                <Row label="Qaimə" value={formatMoney(report.invoiceAzn)} strong />
                <Row
                  label="Qazanc"
                  value={
                    report.marginPercent !== null
                      ? `${formatMoney(report.marginAzn)} · ${report.marginPercent}%`
                      : formatMoney(report.marginAzn)
                  }
                />
              </div>

              {report.plan.capPercentUsed !== null &&
                report.plan.capPercentUsed >= 80 && (
                  <div className="mt-4">
                    <Alert
                      tone={report.plan.capPercentUsed >= 100 ? "err" : "warn"}
                      title={
                        report.plan.capPercentUsed >= 100
                          ? "Aylıq tavan doldu — yeni zənglər qəbul edilmir"
                          : "Aylıq tavana yaxınlaşır"
                      }
                    >
                      {formatMinutes(report.usage.minutes)} /{" "}
                      {formatNumber(report.plan.monthlyMinuteCap)} dəqiqə işlədilib.
                      {report.plan.capPercentUsed >= 100
                        ? " Agent zəngləri operatora yönləndirir. Tavanı artırmaq üçün aşağıdakı sahəni dəyiş."
                        : " Tavan dolanda agent yeni zəngləri qəbul etməyəcək."}
                    </Alert>
                  </div>
                )}

              {report.marginAzn < 0 && (
                <div className="mt-4">
                  <Alert tone="warn" title="Bu biznes zərərlə xidmət alır">
                    Maya dəyəri qaimədən yüksəkdir. Aylıq abunəni və ya artıq dəqiqə
                    qiymətini artırmaq lazımdır.
                  </Alert>
                </div>
              )}

              <form onSubmit={handleSave} className="mt-6">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-fg-muted">
                  Kommersiya şərtləri
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Input
                    label="Aylıq (₼)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(e.target.value)}
                  />
                  <Input
                    label="Daxil olan dəq"
                    type="number"
                    min="0"
                    step="1"
                    value={includedMinutes}
                    onChange={(e) => setIncludedMinutes(e.target.value)}
                  />
                  <Input
                    label="Artıq dəq (₼)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={overagePerMinute}
                    onChange={(e) => setOveragePerMinute(e.target.value)}
                  />
                  <Input
                    label="Aylıq tavan"
                    help="0 = limitsiz"
                    type="number"
                    min="0"
                    step="1"
                    value={minuteCap}
                    onChange={(e) => setMinuteCap(e.target.value)}
                  />
                </div>
                {saveError && (
                  <p className="mt-2 text-sm text-err">{saveError}</p>
                )}
                <div className="mt-4 flex items-center gap-3">
                  <Button type="submit" loading={saving}>
                    Yadda saxla
                  </Button>
                  {saved && !saving && (
                    <span className="text-sm text-fg-muted">Yadda saxlanıldı.</span>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
