import { useEffect, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { useSearchParams } from "react-router-dom";
import {
  clearSetting,
  listSettings,
  recheckProviders,
  revealSetting,
  saveSetting,
  sendTestEmail,
} from "../api/settings";
import type { ProviderHealth, SettingView } from "../api/types";
import { listProviderHealth } from "../api/usage";
import { backfillQuestionAnalysis } from "../api/questions";
import { backfillRagEmbeddings } from "../api/rag";
import { syncAllVapi } from "../api/tenants";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  PageHeader,
  Spinner,
  StatusText,
  Tabs,
} from "../components/ui";
import { IconCheck, IconCopy, IconEye, IconEyeOff } from "../components/icons";
import { formatDateTime } from "../lib/format";

const TAB_VALUES = ["acarlar", "veziyyet"];

const statusLabel: Record<ProviderHealth["status"], string> = {
  OK: "işləyir",
  DOWN: "sıradan çıxıb",
  NOT_CONFIGURED: "qurulmayıb",
};

const statusTone = {
  OK: "ok",
  DOWN: "err",
  NOT_CONFIGURED: "warn",
} as const;

/** Backend 422 ile "bu acar islemir" deyir — hemin metni oldugu kimi gostermek lazimdir. */
function errorMessage(e: unknown): string {
  const err = e as AxiosError<{ detail?: string; message?: string }>;
  return (
    err.response?.data?.detail ??
    err.response?.data?.message ??
    "Yadda saxlanmadı."
  );
}

/**
 * Sirli acarin ipucu ("…a1b2") yaninda "goster" duymesi — kliklenende teze deyeri
 * cekir. Her cagiris serverde loglanir, ona gore hemise ceken yox, isteyende ceken
 * bir komponentdir: sehife acilanda 8 acarin hamisini serverden gostermek mensasizdir.
 */
function RevealableHint({ setting }: { setting: SettingView }) {
  const [shown, setShown] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!setting.secret) {
    return <span className="font-mono text-xs text-fg-muted">{setting.hint}</span>;
  }

  if (shown !== null) {
    const copy = async () => {
      await navigator.clipboard.writeText(shown);
      setCopied(true);
    };
    return (
      <span className="flex items-center gap-1">
        <span className="select-all font-mono text-xs text-fg">{shown}</span>
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          icon={copied ? IconCheck : IconCopy}
          onClick={copy}
          aria-label="Kopyala"
        />
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          icon={IconEyeOff}
          onClick={() => {
            setShown(null);
            setCopied(false);
          }}
          aria-label="Gizlət"
        />
      </span>
    );
  }

  const reveal = async () => {
    setLoading(true);
    setError(null);
    try {
      setShown(await revealSetting(setting.key));
    } catch {
      setError("Alınmadı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <span className="flex items-center gap-1">
      <span className="font-mono text-xs text-fg-muted">{setting.hint}</span>
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        icon={IconEye}
        loading={loading}
        onClick={reveal}
        aria-label="Tam dəyəri göstər"
      />
      {error && <span className="text-xs text-err">{error}</span>}
    </span>
  );
}

function SettingRow({
  setting,
  onSaved,
}: {
  setting: SettingView;
  onSaved: (next: SettingView[]) => void;
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const next = await saveSetting(setting.key, value.trim());
      onSaved(next);
      setValue("");
      setDone("Yoxlanıldı və yadda saxlanıldı.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const revert = async () => {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      onSaved(await clearSetting(setting.key));
      setDone("Server konfiqurasiyasına qaytarıldı.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-b border-border/60 py-5 last:border-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-sm font-medium text-fg">{setting.label}</h3>
        {setting.configured ? (
          <RevealableHint setting={setting} />
        ) : (
          <StatusText tone="warn">təyin olunmayıb</StatusText>
        )}
      </div>
      <p className="mt-1 text-xs text-fg-muted">{setting.description}</p>

      <form onSubmit={submit} className="mt-3 flex flex-wrap items-start gap-2">
        <Input
          type={setting.secret ? "password" : "text"}
          revealable={setting.secret}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={setting.configured ? "Yeni dəyər yazın" : "Dəyər yazın"}
          containerClassName="min-w-[18rem] flex-1"
          autoComplete="off"
        />
        <Button type="submit" loading={busy} disabled={!value.trim()}>
          Yoxla və saxla
        </Button>
        {setting.managedHere && (
          <Button variant="ghost" onClick={revert} disabled={busy}>
            Serverə qaytar
          </Button>
        )}
      </form>

      {error && (
        <p className="mt-2 text-sm text-err">{error}</p>
      )}
      {done && !error && <p className="mt-2 text-sm text-fg-muted">{done}</p>}

      {setting.managedHere && setting.updatedAt && (
        <p className="mt-2 text-xs text-fg-faint">
          Panel dəyəri · {formatDateTime(setting.updatedAt)}
          {setting.updatedBy ? ` · ${setting.updatedBy}` : ""}
        </p>
      )}
      {!setting.managedHere && setting.configured && (
        <p className="mt-2 text-xs text-fg-faint">
          Server konfiqurasiyasından gəlir. Buradan yazsan, panel dəyəri üstün olacaq.
        </p>
      )}
    </div>
  );
}

export function SettingsPage() {
  const [settings, setSettings] = useState<SettingView[] | null>(null);
  const [health, setHealth] = useState<ProviderHealth[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TAB_VALUES.includes(searchParams.get("tab") ?? "")
    ? (searchParams.get("tab") as string)
    : "acarlar";
  const setTab = (v: string) => setSearchParams(v === "acarlar" ? {} : { tab: v }, { replace: true });

  useEffect(() => {
    let cancelled = false;
    Promise.all([listSettings(), listProviderHealth()])
      .then(([s, h]) => {
        if (cancelled) return;
        setSettings(s);
        setHealth(h);
      })
      .catch(() => {
        if (!cancelled) setError("Ayarlar yüklənmədi.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const recheck = async () => {
    setChecking(true);
    try {
      setHealth(await recheckProviders());
    } catch {
      setError("Yoxlama alınmadı.");
    } finally {
      setChecking(false);
    }
  };

  const afterSave = (next: SettingView[]) => {
    setSettings(next);
    recheck();
  };

  if (error) return <Alert tone="err">{error}</Alert>;
  if (!settings) return <Spinner />;

  const broken = health.filter((h) => h.status === "DOWN");

  return (
    <div>
      <PageHeader
        title="Ayarlar"
        subtitle="Provayder açarları. Yazmadan əvvəl hər açar provayderdə yoxlanılır — işləməyən açar yadda saxlanılmır."
      />

      <Tabs
        className="mb-6"
        value={tab}
        onChange={setTab}
        items={[
          { value: "acarlar", label: "Açarlar" },
          { value: "veziyyet", label: "Vəziyyət və alətlər" },
        ]}
      />

      {tab === "acarlar" && (
        <Card>
          <CardHeader
            title="Açarlar"
            description="ElevenLabs açarı və səs ID dəyişdirildikdə Vapi-yə avtomatik ötürülür — ikinci yerdə əl ilə yeniləməyə ehtiyac yoxdur."
          />
          <CardBody className="py-0">
            {settings.map((s) => (
              <SettingRow key={s.key} setting={s} onSaved={afterSave} />
            ))}
          </CardBody>
        </Card>
      )}

      {tab === "veziyyet" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Xidmətlərin vəziyyəti"
              description="Hər 5 dəqiqədən bir avtomatik yoxlanılır."
              actions={
                <Button variant="secondary" size="sm" loading={checking} onClick={recheck}>
                  İndi yoxla
                </Button>
              }
            />
            <CardBody>
              <div className="flex flex-col gap-2">
                {health.map((h) => (
                  <span key={h.name} className="flex items-baseline justify-between gap-2">
                    <span className="text-sm text-fg">{h.name}</span>
                    <StatusText tone={statusTone[h.status]}>
                      {statusLabel[h.status]}
                    </StatusText>
                  </span>
                ))}
              </div>
              {broken.length > 0 && (
                <div className="mt-4 space-y-1 border-t border-border pt-3">
                  {broken.map((h) => (
                    <p key={h.name} className="text-sm text-err">
                      {h.name}: {h.detail}
                    </p>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <TestEmailCard />

          <BackfillCard />

          <VapiSyncAllCard />

          <RagBackfillCard />
        </div>
      )}
    </div>
  );
}

/**
 * SMTP-ni sinaqdan kecirir.
 *
 * Bes sahəni yadda saxlamaq onların işlədiyini SÜBUT ETMİR — server məlumatları rədd edə,
 * göndərən ünvan doğrulanmamış ola, port bağlı ola bilər. Bunu ilk öyrənən adam girişini
 * gözləyən yeni müştəri olmamalıdır.
 */
function TestEmailCard() {
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const send = async () => {
    setBusy(true);
    setResult(null);
    try {
      await sendTestEmail(to.trim());
      setResult({ ok: true, text: `Göndərildi: ${to.trim()}. Gəlmədisə spam qovluğuna bax.` });
    } catch (e) {
      setResult({ ok: false, text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="E-poçt sınağı"
        description="SMTP ayarlarını yazdıqdan sonra buradan bir test mesajı göndər."
      />
      <CardBody>
        <div className="flex flex-wrap items-end gap-2">
          <Input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="ozune@example.com"
            containerClassName="min-w-[16rem] flex-1"
            aria-label="Test ünvanı"
          />
          <Button loading={busy} disabled={!to.includes("@")} onClick={send}>
            Göndər
          </Button>
        </div>
        {result && (
          <p className={`mt-3 text-sm ${result.ok ? "text-fg-muted" : "text-err"}`}>
            {result.text}
          </p>
        )}
      </CardBody>
    </Card>
  );
}

/**
 * Köhnə zəngləri cavabsız sual təhlilindən keçirir.
 *
 * Təhlil zəng bitəndə avtomatik işləyir, amma ondan ƏVVƏL yazılmış zənglər toxunulmamış qalır —
 * yəni funksiya işə düşən gün siyahı boş görünür. Bu düymə onları növbəyə salır. Avtomatik
 * etmirik: hər sətir bir Gemini çağırışıdır və nə vaxt ödəniləcəyinə qərar vermək adamın işidir.
 */
function BackfillCard() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const queued = await backfillQuestionAnalysis(50);
      setResult(
        queued === 0
          ? "Təhlil olunmamış zəng qalmayıb."
          : `${queued} zəng növbəyə salındı. Təhlil arxa fonda gedir — bir neçə dəqiqədən sonra müəssisənin Zənglər siyahısında görünəcək.`,
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Köhnə zənglərin təhlili"
        description="Cavabsız sual təhlili yeni zənglərdə avtomatik işləyir. Bu düymə ondan əvvəlki zəngləri bir dəfəlik keçirir."
        actions={
          <Button variant="secondary" size="sm" loading={busy} onClick={run}>
            Təhlil et
          </Button>
        }
      />
      {(result || error) && (
        <CardBody>
          {error ? <Alert tone="err">{error}</Alert> : <Alert tone="ok">{result}</Alert>}
        </CardBody>
      )}
    </Card>
  );
}

/**
 * Bilik bazasi senedinin embedding-i (axtarish ucun lazim olan riyazi qarshiligi) normalda
 * yalniz server acilanda hesablanir. Bu duyme eyni ishi restart gozlemeden indi gorur — mes.
 * Gemini acari yeni duzeldilibse, bir sonraki restart-a qeder gozlemek lazim gelmesin deye.
 */
function RagBackfillCard() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const run = async () => {
    setBusy(true);
    setResult(null);
    try {
      const r = await backfillRagEmbeddings();
      if (r.total === 0) {
        setResult({ ok: true, text: "Tamamlanmamış sənəd yoxdur — hamısı artıq hazırdır." });
      } else if (!r.geminiConfigured) {
        setResult({
          ok: false,
          text: `${r.total} sənəd gözləyir, amma Gemini açarı təyin olunmayıb — əvvəlcə açarı Açarlar tabında düzəlt.`,
        });
      } else {
        setResult({
          ok: r.embedded === r.total,
          text: `${r.embedded}/${r.total} sənəd tamamlandı.`,
        });
      }
    } catch (e) {
      setResult({ ok: false, text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Bilik bazası embedding-lərini tamamla"
        description="Server açılanda avtomatik işləyən mərhələni indi, restart gözləmədən işə salır."
        actions={
          <Button variant="secondary" size="sm" loading={busy} onClick={run}>
            İndi tamamla
          </Button>
        }
      />
      {result && (
        <CardBody>
          <Alert tone={result.ok ? "ok" : "err"}>{result.text}</Alert>
        </CardBody>
      )}
    </Card>
  );
}

/**
 * Her tenant-in Vapi assistenti oz kopyasini saxlayir — paylasilan bir ayar (domen, ElevenLabs
 * sesi) deyisende hamisi teker-teker deyil, bir defeye ohdesinden gelmek lazimdir. Backend
 * artiq bunu bacarir (tenants/vapi-sync-all), sadece heç bir duyme ona baglanmamisdi.
 */
function VapiSyncAllCard() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const synced = await syncAllVapi();
      setResult(`${synced} müəssisə Vapi ilə yenidən sinxronlaşdırıldı.`);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Bütün müəssisələri Vapi ilə sinxronlaşdır"
        description="Domen, səs ID və ya digər paylaşılan ayarlar dəyişəndə hər müəssisənin Vapi assistentini yeniləyir."
        actions={
          <Button variant="secondary" size="sm" loading={busy} onClick={run}>
            Sinxronlaşdır
          </Button>
        }
      />
      {(result || error) && (
        <CardBody>
          {error ? <Alert tone="err">{error}</Alert> : <Alert tone="ok">{result}</Alert>}
        </CardBody>
      )}
    </Card>
  );
}
