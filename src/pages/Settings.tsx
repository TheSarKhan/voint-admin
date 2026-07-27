import { useEffect, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { clearSetting, listSettings, recheckProviders, saveSetting } from "../api/settings";
import type { ProviderHealth, SettingView } from "../api/types";
import { listProviderHealth } from "../api/usage";
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
