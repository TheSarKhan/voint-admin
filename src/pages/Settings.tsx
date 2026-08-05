import { useEffect, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import {
  clearSetting,
  listSettings,
  recheckProviders,
  saveSetting,
  sendTestEmail,
} from "../api/settings";
import type { ProviderHealth, SettingView } from "../api/types";
import { listProviderHealth } from "../api/usage";
import { backfillQuestionAnalysis } from "../api/questions";
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
} from "../components/ui";
import { formatDateTime } from "../lib/format";

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
          <span className="font-mono text-xs text-fg-muted">{setting.hint}</span>
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
    <div className="space-y-6">
      <PageHeader
        title="Ayarlar"
        subtitle="Provayder açarları. Yazmadan əvvəl hər açar provayderdə yoxlanılır — işləməyən açar yadda saxlanılmır."
      />

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
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {health.map((h) => (
              <span key={h.name} className="flex items-baseline gap-2">
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
      setError(errorText(e, "Təhlil başladıla bilmədi."));
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
