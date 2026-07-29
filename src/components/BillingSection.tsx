import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AxiosError } from "axios";
import { getTenantUsage, updateBillingPlan } from "../api/usage";
import type { Tenant, UsageReport } from "../api/types";
import { IconChevronLeft, IconChevronRight, IconDocument, IconEdit } from "./icons";
import { Alert, Button, Input, Modal, Spinner } from "./ui";
import {
  currentMonth,
  formatMinutes,
  formatMoney,
  formatMonth,
  formatNumber,
} from "../lib/format";

function errorText(e: unknown, fallback: string): string {
  const err = e as AxiosError<{ detail?: string }>;
  return err.response?.data?.detail ?? fallback;
}

/** "2026-07" -> "2026-06". Ay sərhədini əl ilə keçirik ki, locale qarışmasın. */
function previousMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return m === 1
    ? `${y - 1}-12`
    : `${y}-${String(m - 1).padStart(2, "0")}`;
}

function nextMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

/** Rəqəmsiz oxunan nisbət — dolğunluq özü mesajdır. */
function Meter({ ratio, muted = false }: { ratio: number; muted?: boolean }) {
  const width = Math.max(Math.min(ratio, 1) * 100, ratio > 0 ? 0.4 : 0);
  return (
    <div className="relative h-2 border border-border bg-surface-2">
      <div
        className={`absolute inset-y-0 left-0 ${muted ? "bg-fg-faint" : "bg-fg-muted"}`}
        style={{ width: `${width}%`, minWidth: width > 0 ? "3px" : 0 }}
      />
    </div>
  );
}

/**
 * Hesablaşma — üç oxuma məsafəsi.
 *
 * Özət (5 saniyə) → istifadə və maya (aylıq baxış) → kommersiya şərtləri (yalnız oxunur).
 * Şərtlərin redaktəsi ayrıca pəncərəyə çıxarılıb: qiymət dəyişdirmək təsadüfən edilən iş deyil,
 * və hesabata baxarkən yanında duran bir input sahəsi məhz onu asanlaşdırır.
 */
export function BillingSection({
  tenant,
  onPlanSaved,
}: {
  tenant: Tenant;
  onPlanSaved: (updated: Tenant) => void;
}) {
  const thisMonth = useMemo(() => currentMonth(), []);
  const [month, setMonth] = useState(thisMonth);
  const [report, setReport] = useState<UsageReport | null>(null);
  const [previous, setPrevious] = useState<UsageReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // Ay bağlanmayıb: rəqəmlər hər baxışda yenidən hesablanır və sabaha dəyişəcək.
  // Bunu deməmək, göndərilməmiş qaiməni yekun kimi göstərmək deməkdir.
  const forecast = month === thisMonth;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPrevious(null);

    getTenantUsage(tenant.id, month)
      .then((r) => {
        if (!cancelled) setReport(r);
      })
      .catch(() => {
        if (!cancelled) setError("Hesablaşma məlumatı yüklənmədi.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Müqayisə ayı ayrıca gəlir və gəlməsə ekran işləməyə davam edir — keçən ay
    // yoxdursa (yeni müəssisə) bu, xəta deyil.
    getTenantUsage(tenant.id, previousMonth(month))
      .then((r) => {
        if (!cancelled) setPrevious(r);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [tenant.id, month]);

  if (loading && !report) return <Spinner />;
  if (error) return <Alert tone="err">{error}</Alert>;
  if (!report) return null;

  const { usage, cost, plan } = report;
  const includedRatio = plan.includedMinutes > 0 ? usage.minutes / plan.includedMinutes : 0;
  const capRatio = plan.monthlyMinuteCap > 0 ? usage.minutes / plan.monthlyMinuteCap : 0;
  const noCalls = usage.calls === 0;

  const costLines = [
    { label: "Vapi platforma", value: cost.vapi },
    { label: "Səs", hint: "ElevenLabs", value: cost.tts },
    { label: "Telefoniya", value: cost.telephony },
    { label: "Nitq tanıma", hint: "Soniox", value: cost.stt },
    { label: "AI", hint: "Gemini", value: cost.llm },
  ].sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-5">
      {/* alət sətri */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center border border-border bg-surface">
            <button
              type="button"
              aria-label="Əvvəlki ay"
              onClick={() => setMonth(previousMonth(month))}
              className="grid h-9 w-9 place-items-center border-r border-border text-fg-muted transition-colors hover:text-fg"
            >
              <IconChevronLeft width={16} height={16} />
            </button>
            <span className="min-w-[7rem] px-4 text-center text-sm font-medium text-fg">
              {formatMonth(month)}
            </span>
            <button
              type="button"
              aria-label="Sonrakı ay"
              disabled={month >= thisMonth}
              onClick={() => setMonth(nextMonth(month))}
              className="grid h-9 w-9 place-items-center border-l border-border text-fg-muted transition-colors hover:text-fg disabled:text-border-strong"
            >
              <IconChevronRight width={16} height={16} />
            </button>
          </div>

          {forecast && (
            <div className="leading-tight">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-warn">
                Gözlənilən
              </p>
              <p className="mt-0.5 text-xs text-fg-faint">
                ay bitməyib · rəqəmlər hələ dəyişir
              </p>
            </div>
          )}
        </div>

        <Link to={`/tenants/${tenant.subdomain ?? tenant.id}/invoice?month=${month}`}>
          <Button variant={forecast ? "secondary" : "primary"} icon={IconDocument}>
            {forecast ? "Qaralama qaimə" : "Qaimə"}
          </Button>
        </Link>
      </div>

      {noCalls ? (
        /* Sıfırlarla dolu cədvəl yerinə tək faktiki rəqəm və səbəb: "0.00 marj" yanlış oxunur. */
        <div className="border border-border bg-surface p-8">
          <p className="text-lg text-fg">Bu ay hələ zəng qeydə alınmayıb.</p>
          <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-fg-muted">
            Hesablanacaq yalnız abunədir:{" "}
            <span className="text-fg">{formatMoney(plan.monthlyFee)}</span>. Maya dəyəri və
            marj ilk zəngdən sonra göstərilir. Zəng gözlənilirdisə, nömrənin
            yönləndirilməsini yoxlamaq lazımdır.
          </p>
        </div>
      ) : (
        <>
          {/* ÖZƏT — qaimə − maya = marj */}
          <div className="border border-border bg-surface">
            <div className="px-8 pb-7 pt-7">
              <p className="mb-1 text-right text-xs text-fg-faint">bütün məbləğlər ₼</p>
              <div className="grid grid-cols-1 items-baseline gap-8 lg:grid-cols-[1fr_2.5rem_1fr_2.5rem_1.35fr] lg:gap-0">
                <div>
                  <p className="mb-2.5 text-xs uppercase tracking-[0.08em] text-fg-faint">
                    Qaimə
                  </p>
                  <p className="text-5xl leading-none tracking-tight tabular-nums text-fg">
                    {report.invoiceAzn.toFixed(2)}
                  </p>
                  <p className="mt-2.5 text-sm text-fg-muted">
                    Abunə {plan.monthlyFee.toFixed(2)} · artıq dəqiqə{" "}
                    {(report.invoiceAzn - plan.monthlyFee).toFixed(2)}
                  </p>
                </div>

                <span className="hidden self-center text-center text-3xl text-border-strong lg:block">
                  −
                </span>

                <div>
                  <p className="mb-2.5 text-xs uppercase tracking-[0.08em] text-fg-faint">
                    Maya dəyəri
                  </p>
                  <p className="text-5xl leading-none tracking-tight tabular-nums text-fg">
                    {cost.total.toFixed(2)}
                  </p>
                  <p className="mt-2.5 text-sm text-fg-muted">
                    Provayderlərə ödənilən · 5 maddə
                  </p>
                </div>

                <span className="hidden self-center text-center text-3xl text-border-strong lg:block">
                  =
                </span>

                <div className="lg:border-l lg:border-border lg:pl-8">
                  <p className="mb-2.5 text-xs uppercase tracking-[0.08em] text-fg-muted">
                    Marj
                  </p>
                  <div className="flex items-baseline gap-3.5">
                    <p className="text-5xl font-medium leading-none tracking-tight tabular-nums text-fg">
                      {report.marginAzn.toFixed(2)}
                    </p>
                    {report.marginPercent !== null && (
                      <p className="text-2xl tracking-tight tabular-nums text-fg-muted">
                        %{report.marginPercent.toFixed(1)}
                      </p>
                    )}
                  </div>
                  {/* Bu şərt dipnot deyil, rəqəmin bir hissəsidir: onsuz qiymət qərarı
                      olmayan bir mənfəətə əsaslanır. */}
                  <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-fg-muted">
                    Yalnız <span className="text-fg">provayder xərcindən sonra</span>. VPS,
                    SIP xətt kirası və ElevenLabs abunəsi bu rəqəmə daxil deyil.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-11 gap-y-2 border-t border-border px-8 py-4">
              {plan.includedMinutes > 0 && (
                <p className="text-sm text-fg-muted">
                  Paket istifadəsi{" "}
                  <span
                    className={
                      includedRatio < 0.25 ? "font-medium text-warn" : "font-medium text-fg"
                    }
                  >
                    %{(includedRatio * 100).toFixed(1)}
                  </span>{" "}
                  — {plan.includedMinutes} dəqiqənin {formatMinutes(usage.minutes)}-ü
                </p>
              )}
              <p className="text-sm text-fg-muted">
                Sabit xərclər <span className="text-fg-faint">təyin edilməyib</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_32rem]">
            {/* İSTİFADƏ VƏ PAKET UYĞUNLUĞU */}
            <div className="border border-border bg-surface p-7">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-base font-medium text-fg">
                  İstifadə və paket uyğunluğu
                </h3>
                {previous && (
                  <span className="text-xs text-fg-faint">
                    müqayisə: {formatMonth(previous.month)}
                  </span>
                )}
              </div>

              {plan.includedMinutes > 0 && includedRatio < 0.25 && (
                <p className="mt-1.5 text-xs font-medium uppercase tracking-[0.1em] text-warn">
                  Paket istifadə olunmur
                </p>
              )}

              <div className="mt-6 space-y-6">
                {plan.includedMinutes > 0 && (
                  <div>
                    <div className="mb-2 flex items-baseline justify-between text-sm">
                      <span className="text-fg">Daxil olan dəqiqə</span>
                      <span className="tabular-nums text-fg-muted">
                        <span className="text-fg">{formatMinutes(usage.minutes)}</span> /{" "}
                        {plan.includedMinutes} dəq · %{(includedRatio * 100).toFixed(1)}
                      </span>
                    </div>
                    <Meter ratio={includedRatio} />
                    <p className="mt-2 text-xs text-fg-faint">
                      {plan.overageMinutes > 0
                        ? `Artıq ${formatMinutes(plan.overageMinutes)} · ${plan.overagePerMinute} ₼/dəq`
                        : `Artıq dəqiqə yoxdur · aşım ${plan.overagePerMinute} ₼/dəq`}
                    </p>
                  </div>
                )}

                {plan.monthlyMinuteCap > 0 && (
                  <div>
                    <div className="mb-2 flex items-baseline justify-between text-sm">
                      <span className="text-fg">Aylıq tavan</span>
                      <span className="tabular-nums text-fg-muted">
                        <span className="text-fg">{formatMinutes(usage.minutes)}</span> /{" "}
                        {formatNumber(plan.monthlyMinuteCap)} dəq · %
                        {(capRatio * 100).toFixed(1)}
                      </span>
                    </div>
                    <Meter ratio={capRatio} muted />
                  </div>
                )}
              </div>

              <div className="mt-7 border-t border-border">
                <div className="grid grid-cols-[1fr_7rem_7rem] border-b border-border py-3 text-xs text-fg-faint">
                  <span />
                  <span className="text-right">{formatMonth(month)}</span>
                  <span className="text-right">
                    {previous ? formatMonth(previous.month) : "—"}
                  </span>
                </div>
                {[
                  {
                    label: "Zəng sayı",
                    now: formatNumber(usage.calls),
                    then: previous ? formatNumber(previous.usage.calls) : "—",
                  },
                  {
                    label: "Ümumi danışıq",
                    now: `${formatMinutes(usage.minutes)} dəq`,
                    then: previous ? `${formatMinutes(previous.usage.minutes)} dəq` : "—",
                  },
                  {
                    label: "Səsə çevrilən hərf",
                    now: formatNumber(usage.ttsCharacters),
                    then: previous ? formatNumber(previous.usage.ttsCharacters) : "—",
                  },
                  {
                    label: "AI token",
                    hint: `${formatNumber(usage.promptTokens)} giriş / ${formatNumber(usage.completionTokens)} çıxış`,
                    now: formatNumber(usage.totalTokens),
                    then: previous ? formatNumber(previous.usage.totalTokens) : "—",
                  },
                ].map((r) => (
                  <div
                    key={r.label}
                    className="grid grid-cols-[1fr_7rem_7rem] border-b border-border/50 py-3 text-sm last:border-0"
                  >
                    <span className="text-fg-muted">
                      {r.label}
                      {r.hint && (
                        <span className="ml-1.5 text-fg-faint">({r.hint})</span>
                      )}
                    </span>
                    <span className="text-right tabular-nums text-fg">{r.now}</span>
                    <span className="text-right tabular-nums text-fg-faint">{r.then}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* MAYA DƏYƏRİ DAĞILIMI */}
            <div className="border border-border bg-surface p-7">
              <div className="mb-6 flex items-baseline justify-between gap-4">
                <h3 className="text-base font-medium text-fg">Maya dəyəri dağılımı</h3>
                <span className="text-xs text-fg-faint">₼ · payı</span>
              </div>

              <div className="space-y-4">
                {costLines.map((line, i) => {
                  const share = cost.total > 0 ? line.value / cost.total : 0;
                  return (
                    <div
                      key={line.label}
                      className="grid grid-cols-[9.5rem_1fr_4rem_3rem] items-center gap-3.5 text-sm"
                    >
                      <span className="text-fg">
                        {line.label}
                        {line.hint && (
                          <span className="ml-1.5 text-fg-faint">{line.hint}</span>
                        )}
                      </span>
                      <div className="relative h-2 bg-surface-2">
                        <div
                          className={`absolute inset-y-0 left-0 ${i === 0 ? "bg-fg" : "bg-fg-muted"}`}
                          style={{
                            width: `${Math.max(share * 100, share > 0 ? 0.6 : 0)}%`,
                            minWidth: share > 0 ? "3px" : 0,
                          }}
                        />
                      </div>
                      <span className="text-right tabular-nums text-fg">
                        {line.value.toFixed(2)}
                      </span>
                      <span className="text-right text-xs tabular-nums text-fg-muted">
                        %{(share * 100).toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 grid grid-cols-[9.5rem_1fr_4rem_3rem] items-center gap-3.5 border-t border-border pt-4 text-sm font-medium">
                <span className="text-fg">Cəmi</span>
                <span />
                <span className="text-right tabular-nums text-fg">
                  {cost.total.toFixed(2)}
                </span>
                <span className="text-right text-xs font-normal tabular-nums text-fg-faint">
                  %100
                </span>
              </div>

              <div className="mt-4 border-t border-border pt-4">
                <div className="grid grid-cols-[9.5rem_1fr_4rem_3rem] items-center gap-3.5 text-sm text-fg-faint">
                  <span>Sabit xərclər</span>
                  <span className="text-xs">VPS · SIP xətt · ElevenLabs abunəsi</span>
                  <span className="text-right">—</span>
                  <span />
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-fg-faint">
                  Müştəriyə bölüşdürülməyib. Yuxarıdakı marj bu xərclərdən əvvəldir.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* KOMMERSİYA ŞƏRTLƏRİ — yalnız oxunur */}
      <div className="border border-border bg-surface p-7">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex-1">
            <h3 className="mb-5 text-base font-medium text-fg">Kommersiya şərtləri</h3>
            <div className="grid grid-cols-2 gap-7 sm:grid-cols-4">
              {[
                { label: "Abunə", value: plan.monthlyFee.toFixed(2), unit: "₼/ay" },
                {
                  label: "Daxil olan dəqiqə",
                  value: formatNumber(plan.includedMinutes),
                  unit: "dəq",
                },
                {
                  label: "Artıq dəqiqə haqqı",
                  value: plan.overagePerMinute.toFixed(2),
                  unit: "₼/dəq",
                },
                {
                  label: "Aylıq tavan",
                  value:
                    plan.monthlyMinuteCap > 0
                      ? formatNumber(plan.monthlyMinuteCap)
                      : "limitsiz",
                  unit: plan.monthlyMinuteCap > 0 ? "dəq" : "",
                },
              ].map((f) => (
                <div key={f.label}>
                  <p className="mb-1.5 text-xs text-fg-faint">{f.label}</p>
                  <p className="text-xl tabular-nums text-fg">
                    {f.value}
                    {f.unit && (
                      <span className="ml-1 text-sm text-fg-faint">{f.unit}</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <Button variant="secondary" icon={IconEdit} onClick={() => setEditOpen(true)}>
            Şərtləri dəyiş
          </Button>
        </div>
      </div>

      {editOpen && (
        <TermsModal
          tenant={tenant}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => {
            onPlanSaved(updated);
            setEditOpen(false);
            // Şərtlər dəyişdi — cari ayın hesabı da dəyişir, ona görə yenidən oxunur.
            getTenantUsage(tenant.id, month).then(setReport).catch(() => undefined);
          }}
        />
      )}
    </div>
  );
}

/**
 * Şərtlərin dəyişdirilməsi.
 *
 * Ayrıca pəncərədə, çünki bu, hesabata baxmaqla eyni iş deyil: müştərinin nə ödəyəcəyini
 * dəyişir və ildə bir-iki dəfə edilir. Dizayn sağ panel təklif edirdi; burada modal
 * istifadə olunur, çünki panelin arxasındakı hesabat onsuz da yeni dəyərlə yenidən
 * hesablanacaq, yəni köhnə rəqəmi yanaşı görməyin faydası yoxdur.
 */
function TermsModal({
  tenant,
  onClose,
  onSaved,
}: {
  tenant: Tenant;
  onClose: () => void;
  onSaved: (t: Tenant) => void;
}) {
  const [monthlyFee, setMonthlyFee] = useState(String(tenant.monthlyFee ?? 0));
  const [includedMinutes, setIncludedMinutes] = useState(
    String(tenant.includedMinutes ?? 0),
  );
  const [overagePerMinute, setOveragePerMinute] = useState(
    String(tenant.overagePerMinute ?? 0),
  );
  const [minuteCap, setMinuteCap] = useState(String(tenant.monthlyMinuteCap ?? 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      onSaved(
        await updateBillingPlan(tenant.id, {
          monthlyFee: Number(monthlyFee),
          includedMinutes: Number(includedMinutes),
          overagePerMinute: Number(overagePerMinute),
          monthlyMinuteCap: Number(minuteCap),
        }),
      );
    } catch (e) {
      setError(errorText(e, "Yadda saxlanmadı."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal size="lg" title="Kommersiya şərtlərini dəyiş" onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <Input
          label="Aylıq abunə"
          help="₼"
          type="number"
          step="0.01"
          min="0"
          value={monthlyFee}
          onChange={(e) => setMonthlyFee(e.target.value)}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Daxil olan dəqiqə"
            type="number"
            min="0"
            value={includedMinutes}
            onChange={(e) => setIncludedMinutes(e.target.value)}
          />
          <Input
            label="Artıq dəqiqə haqqı"
            help="₼/dəq"
            type="number"
            step="0.01"
            min="0"
            value={overagePerMinute}
            onChange={(e) => setOveragePerMinute(e.target.value)}
          />
        </div>
        <Input
          label="Aylıq tavan"
          help="dəq · 0 = limitsiz. Bu, kommersiya limiti deyil, xərc mühafizəsidir: keçilsə agent cavab verməyi dayandırır."
          type="number"
          min="0"
          value={minuteCap}
          onChange={(e) => setMinuteCap(e.target.value)}
        />

        {/* Geriyə dönük təsir gerçəkdir və gizlədilməməlidir: qüvvəyə minmə tarixi
            backend-də yoxdur, ona görə söz vermək əvəzinə olanı deyirik. */}
        <Alert tone="warn">
          Dəyişiklik dərhal qüvvəyə minir və <span className="text-fg">cari ayın</span>{" "}
          hesabına da tətbiq olunur. Keçmiş ayların qaiməsi də yenidən hesablanır — aylar
          hələ bağlanmır.
        </Alert>

        {error && <p className="text-sm text-err">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Ləğv et
          </Button>
          <Button type="submit" loading={saving}>
            Şərtləri yenilə
          </Button>
        </div>
      </form>
    </Modal>
  );
}
