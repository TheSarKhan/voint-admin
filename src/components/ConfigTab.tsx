import { useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import { updateTenantConfig } from "../api/tenants";
import type { Tenant } from "../api/types";
import { LanguagePicker, parseLanguages, serializeLanguages } from "./LanguagePicker";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Textarea,
} from "./ui";
import { formatDateTime } from "../lib/format";

function errorText(e: unknown, fallback: string): string {
  const err = e as AxiosError<{ detail?: string }>;
  return err.response?.data?.detail ?? fallback;
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
      const updated = await updateTenantConfig(tenant.id, {
        greetingText: greeting.trim(),
        workingHours: hours.trim(),
        handoffNumber: handoff.trim(),
        languageConfig: serializeLanguages(defLang, supported, initialLangs.extra),
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

          <LanguagePicker
            defLang={defLang}
            supported={supported}
            onChangeDefLang={(code) => {
              setDefLang(code);
              setDone(false);
            }}
            onToggleLanguage={toggleLanguage}
          />

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
