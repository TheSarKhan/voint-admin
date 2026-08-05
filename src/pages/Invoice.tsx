import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getTenantUsage } from "../api/usage";
import { getPublicConfig } from "../api/publicConfig";
import { getTenant } from "../api/tenants";
import type { Tenant, UsageReport } from "../api/types";
import { IconArrowLeft, IconDownload } from "../components/icons";
import { Alert, Spinner } from "../components/ui";
import {
  currentMonth,
  formatMinutes,
  formatMoney,
  formatMonth,
  formatNumber,
  monthEndDate,
} from "../lib/format";

/**
 * Cap olunan qaime. Brauzerin "Save as PDF" imkani ile PDF-e cevrilir.
 *
 * Neden serverde PDF yaratmiriq: Azerbaycan herfleri (xususile "ə", U+0259) standart
 * PDF sriftlerinde yoxdur - serverde ayrica Unicode srift yerlesdirmek lazim gelerdi.
 * Brauzer ise artiq Poppins-i yukleyib (icinde butun AZ herfleri var, yoxlanilib),
 * ona gore burada cap etmek hem sadedir, hem de herflerin duzgun cixmasina zemanet verir.
 */

/** Deterministik qaime nomresi: eyni ay + eyni biznes -> her defe eyni nomre. */
function invoiceNumber(tenantId: string, month: string): string {
  return `VOINT-${month.replace("-", "")}-${tenantId.slice(0, 4).toUpperCase()}`;
}

interface LineItem {
  description: string;
  detail: string;
  amount: number;
}

function buildLineItems(report: UsageReport): LineItem[] {
  const items: LineItem[] = [];

  if (report.plan.monthlyFee > 0) {
    items.push({
      description: "Aylıq abunə — Voint AI səs agenti",
      detail:
        report.plan.includedMinutes > 0
          ? `${formatNumber(report.plan.includedMinutes)} dəqiqə daxil`
          : "Limitsiz",
      amount: report.plan.monthlyFee,
    });
  }

  if (report.plan.overageMinutes > 0) {
    items.push({
      description: "Əlavə danışıq dəqiqələri",
      detail: `${formatMinutes(report.plan.overageMinutes)} × ${formatMoney(
        report.plan.overagePerMinute,
      )}`,
      amount: report.plan.overageMinutes * report.plan.overagePerMinute,
    });
  }

  return items;
}

export function InvoicePage() {
  const { tenantKey = "" } = useParams();
  const [params] = useSearchParams();
  const month = params.get("month") ?? currentMonth();

  const [report, setReport] = useState<UsageReport | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platformDomain, setPlatformDomain] = useState("voint.az");

  useEffect(() => {
    getPublicConfig().then((c) => setPlatformDomain(c.panelDomain));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    // Unvanda subdomain ola biler, usage endpoint-i ise UUID isteyir — ardicil gedirik:
    // evvelce muessiseni hell et, sonra onun heqiqi id-si ile hesabati cek.
    (async () => {
      try {
        const t = await getTenant(tenantKey);
        if (cancelled) return;
        setTenant(t);
        const r = await getTenantUsage(t.id, month);
        if (!cancelled) setReport(r);
      } catch {
        if (!cancelled) setError("Qaimə məlumatı yüklənmədi.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantKey, month]);

  if (loading) return <Spinner />;
  if (error) return <Alert tone="err">{error}</Alert>;
  if (!report) return null;

  const items = buildLineItems(report);
  const total = items.reduce((s, i) => s + i.amount, 0);

  return (
    <>
      {/* Cap zamani yalniz vereq qalir: ekran elementleri gizlenir, fon agarir. */}
      <style>{`
        @media print {
          @page { size: A4; margin: 16mm; }
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .print-sheet {
            box-shadow: none !important;
            border: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: none !important;
            width: auto !important;
          }
          /* Brauzerlerin defolt olaraq fon rengini atmasinin qarsisini alir */
          .print-sheet * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="no-print mb-6 flex items-center justify-between gap-4">
        <Link
          to={`/tenants/${tenantKey}`}
          className="inline-flex items-center gap-2 text-sm text-fg-muted transition-colors hover:text-fg"
        >
          <IconArrowLeft width={15} height={15} />
          {report.tenantName}
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-md bg-fg px-3.5 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90"
        >
          <IconDownload width={15} height={15} />
          PDF yarat
        </button>
      </div>

      {/* Sened. Qesden ag vereq: qaime cap ucundur, panelin qaranliq temasi ucun yox. */}
      <div
        className="print-sheet mx-auto w-full max-w-[820px] bg-white p-12 text-[#111] shadow-xl"
        style={{ colorScheme: "light" }}
      >
        <header className="flex items-start justify-between gap-8 border-b border-[#111] pb-6">
          <div>
            <p className="text-2xl font-semibold tracking-tight">Voint</p>
            <p className="mt-1 text-xs leading-relaxed text-[#555]">
              AI səs agenti və CRM platforması
              <br />
              {/* Domen backend-dən gəlir: qaimə çap olunub müştəriyə gedir, orada
                  köhnə ünvan yazmaq onu açılmayan bir sayta yönəldir. */}
              {platformDomain}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold tracking-tight">QAİMƏ</p>
            <p className="mt-1 font-mono text-xs text-[#555]">
              {invoiceNumber(report.tenantId, report.month)}
            </p>
            <p className="mt-0.5 text-xs text-[#555]">
              {monthEndDate(report.month)}
            </p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-8 border-b border-[#ddd] py-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#888]">
              Müştəri
            </p>
            <p className="mt-1.5 font-medium">{report.tenantName}</p>
            {tenant?.phoneNumber && (
              <p className="text-sm text-[#555]">{tenant.phoneNumber}</p>
            )}
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#888]">
              Hesabat dövrü
            </p>
            <p className="mt-1.5 font-medium">{formatMonth(report.month)}</p>
            <p className="text-sm text-[#555]">
              {formatNumber(report.usage.calls)} zəng ·{" "}
              {formatMinutes(report.usage.minutes)}
            </p>
          </div>
        </section>

        <table className="w-full border-collapse py-6 text-sm">
          <thead>
            <tr className="border-b border-[#ddd] text-left">
              <th className="py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#888]">
                Xidmət
              </th>
              <th className="py-3 text-right text-[11px] font-medium uppercase tracking-[0.08em] text-[#888]">
                Məbləğ
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={2} className="py-6 text-center text-[#888]">
                  Bu dövr üçün ödəniş yoxdur.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.description} className="border-b border-[#eee]">
                  <td className="py-4">
                    <p className="font-medium">{item.description}</p>
                    <p className="mt-0.5 text-xs text-[#777]">{item.detail}</p>
                  </td>
                  <td className="py-4 text-right tabular-nums">
                    {formatMoney(item.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr>
              <td className="pt-5 text-right font-medium">Yekun</td>
              <td className="pt-5 text-right text-xl font-semibold tabular-nums">
                {formatMoney(total)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Istifade tefsilati - musteri neye gore odediyini gorsun. */}
        <section className="mt-8 border-t border-[#ddd] pt-6">
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#888]">
            İstifadə təfsilatı
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-[#777]">Zəng sayı</dt>
              <dd className="tabular-nums">{formatNumber(report.usage.calls)}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#777]">Ümumi danışıq</dt>
              <dd className="tabular-nums">
                {formatMinutes(report.usage.minutes)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#777]">Daxil olan</dt>
              <dd className="tabular-nums">
                {formatNumber(report.plan.includedMinutes)} dəq
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#777]">Artıq danışıq</dt>
              <dd className="tabular-nums">
                {report.plan.overageMinutes > 0
                  ? formatMinutes(report.plan.overageMinutes)
                  : "—"}
              </dd>
            </div>
          </dl>
        </section>

        <footer className="mt-10 border-t border-[#ddd] pt-4 text-xs leading-relaxed text-[#777]">
          Ödəniş qaimə tarixindən etibarən 10 iş günü ərzində həyata keçirilməlidir.
          Suallarınız üçün bizimlə əlaqə saxlayın.
        </footer>
      </div>
    </>
  );
}
