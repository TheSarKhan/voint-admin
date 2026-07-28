import { useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { updateTenantConfig } from "../api/tenants";
import type { Tenant } from "../api/types";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  Textarea,
} from "./ui";
import { formatDateTime } from "../lib/format";

function errorText(e: unknown, fallback: string): string {
  const err = e as AxiosError<{ detail?: string }>;
  return err.response?.data?.detail ?? fallback;
}

/** Agentin danışa bildiyi dillər. Soniox və ElevenLabs hər üçünü dəstəkləyir. */
const LANGUAGES = [
  { code: "az", label: "Azərbaycanca" },
  { code: "ru", label: "Rusca" },
  { code: "en", label: "İngiliscə" },
  { code: "tr", label: "Türkcə" },
];

/**
 * Dil konfiqurasiyası bazada JSON kimi saxlanılır.
 *
 * Operatora JSON yazdırmaq olmaz — bir vergül unudulsa agent dili tamamilə itirir. Ona görə
 * burada oxunur, düymələrlə redaktə olunur, yenidən JSON kimi yazılır. Tanımadığımız açarlar
 * SAXLANILIR: bu sahəyə sonradan başqa bir şey əlavə olunubsa, bu ekran onu silməməlidir.
 */
function parseLanguages(raw: string | null): {
  def: string;
  supported: string[];
  extra: Record<string, unknown>;
  broken: boolean;
} {
  if (!raw || !raw.trim()) {
    return { def: "az", supported: ["az"], extra: {}, broken: false };
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const { default: def, supported, ...extra } = parsed;
    return {
      def: typeof def === "string" ? def : "az",
      supported: Array.isArray(supported)
        ? supported.filter((s): s is string => typeof s === "string")
        : ["az"],
      extra,
      broken: false,
    };
  } catch {
    // Sahə əl ilə pozulubsa forma onu uydurmamalıdır - istifadəçiyə deyilir.
    return { def: "az", supported: ["az"], extra: {}, broken: true };
  }
}

export function ConfigTab({
  tenant,
  onSaved,
}: {
  tenant: Tenant;
  onSaved: (t: Tenant) => void;
}) {
  const initialLangs = parseLanguages(tenant.languageConfig);

  const [greeting, setGreeting] = useState(tenant.greetingText ?? "");
  const [hours, setHours] = useState(tenant.workingHours ?? "");
  const [handoff, setHandoff] = useState(tenant.handoffNumber ?? "");
  const [domain, setDomain] = useState(tenant.sttDomain ?? "");
  const [topic, setTopic] = useState(tenant.sttTopic ?? "");
  const [vocabulary, setVocabulary] = useState(tenant.sttVocabulary ?? "");
  const [defLang, setDefLang] = useState(initialLangs.def);
  const [supported, setSupported] = useState<string[]>(initialLangs.supported);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const toggleLanguage = (code: string) => {
    setSupported((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
    setDone(false);
  };

  const words = vocabulary
    .split(",")
    .map((w) => w.trim())
    .filter(Boolean);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setDone(false);
    try {
      // Əsas dil dəstəklənənlərin içində olmalıdır, yoxsa agent heç bir dildə başlaya bilmir.
      const langs = supported.includes(defLang) ? supported : [defLang, ...supported];
      const updated = await updateTenantConfig(tenant.id, {
        greetingText: greeting.trim(),
        workingHours: hours.trim(),
        handoffNumber: handoff.trim(),
        languageConfig: JSON.stringify({
          ...initialLangs.extra,
          default: defLang,
          supported: langs,
        }),
        sttDomain: domain.trim(),
        sttTopic: topic.trim(),
        sttVocabulary: words.join(","),
      });
      onSaved(updated);
      setDone(true);
    } catch (e) {
      setError(errorText(e, "Yadda saxlanmadı."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <Card>
        <CardHeader
          title="Konfiqurasiya"
          description="Yadda saxlanıldıqda dəyişiklik Vapi-dəki agentə də ötürülür — növbəti zəngdən qüvvəyə minir."
          actions={
            <Button type="submit" size="sm" loading={saving}>
              Yadda saxla
            </Button>
          }
        />
        <CardBody className="space-y-5">
          {error && <Alert tone="err">{error}</Alert>}

          {initialLangs.broken && (
            <Alert tone="warn" title="Dil konfiqurasiyası oxunmadı">
              Bazadakı dəyər düzgün JSON deyil, ona görə aşağıda ilkin dəyərlər göstərilir.
              Yadda saxlasan, sahə bu formadakı dəyərlərlə əvəz olunacaq.
            </Alert>
          )}

          <Textarea
            label="Salamlama mətni"
            help="Zəng açılan kimi deyilən ilk cümlə."
            rows={2}
            showCount
            maxLength={400}
            value={greeting}
            onChange={(e) => {
              setGreeting(e.target.value);
              setDone(false);
            }}
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              label="İş saatları"
              help="Agent bu saatlardan kənarda başqa cavab verir."
              placeholder="B.e-Şənbə 09:00-18:00, Bazar bağlıdır"
              value={hours}
              onChange={(e) => {
                setHours(e.target.value);
                setDone(false);
              }}
            />
            <Input
              label="Operatora yönləndirmə nömrəsi"
              help="Agent cavab verə bilmədikdə zəng bura ötürülür."
              placeholder="+994500000000"
              value={handoff}
              onChange={(e) => {
                setHandoff(e.target.value);
                setDone(false);
              }}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Select
              label="Əsas dil"
              help="Agent bu dildə başlayır."
              value={defLang}
              onChange={(e) => {
                setDefLang(e.target.value);
                setDone(false);
              }}
              options={LANGUAGES.map((l) => ({ value: l.code, label: l.label }))}
            />
            <div>
              <span className="mb-2 block text-sm font-medium text-fg">Dəstəklənən dillər</span>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {LANGUAGES.map((l) => (
                  <label key={l.code} className="flex items-center gap-2 text-sm text-fg">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-accent"
                      checked={supported.includes(l.code) || l.code === defLang}
                      disabled={l.code === defLang}
                      onChange={() => toggleLanguage(l.code)}
                    />
                    {l.label}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-fg-muted">
                Əsas dil həmişə daxildir və çıxarıla bilməz.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              label="Fəaliyyət sahəsi"
              help="Tanınmanı yaxşılaşdırır: modelə nədən danışıldığını bildirir."
              placeholder="Texnika icarəsi (tikinti texnikası) — Azərbaycan"
              value={domain}
              onChange={(e) => {
                setDomain(e.target.value);
                setDone(false);
              }}
            />
            <Input
              label="Mövzu"
              help="Daha dar kontekst. Boş qala bilər."
              placeholder="Avadanlıq icarəsi və rezervasiya"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                setDone(false);
              }}
            />
          </div>

          <Textarea
            label="Nitq lüğəti"
            help={`Vergüllə ayrılmış terminlər — ${words.length} söz. Azərbaycan şəhər adları hamıya avtomatik əlavə olunur.`}
            rows={3}
            value={vocabulary}
            onChange={(e) => {
              setVocabulary(e.target.value);
              setDone(false);
            }}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <span className="text-xs text-fg-faint">
              Yaradılıb: {formatDateTime(tenant.createdAt)}
            </span>
            {done && (
              <span className="text-sm text-fg-muted">
                Yadda saxlanıldı və Vapi-yə ötürüldü.
              </span>
            )}
          </div>
        </CardBody>
      </Card>
    </form>
  );
}
