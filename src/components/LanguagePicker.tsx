import type { ChangeEvent } from "react";
import { Select } from "./ui";

/** Agentin danışa bildiyi dillər. Soniox və ElevenLabs hər üçünü dəstəkləyir. */
export const LANGUAGES = [
  { code: "az", label: "Azərbaycanca" },
  { code: "ru", label: "Rusca" },
  { code: "en", label: "İngiliscə" },
  { code: "tr", label: "Türkcə" },
];

export interface ParsedLanguages {
  def: string;
  supported: string[];
  extra: Record<string, unknown>;
  broken: boolean;
}

/**
 * Dil konfiqurasiyası bazada JSON kimi saxlanılır (məs.
 * {"default":"az","supported":["az","ru"]}).
 *
 * Operatora JSON yazdırmaq olmaz — bir vergül unudulsa agent dili tamamilə itirir. Ona görə
 * burada oxunur, düymələrlə redaktə olunur, yenidən JSON kimi yazılır. Tanımadığımız açarlar
 * SAXLANILIR: bu sahəyə sonradan başqa bir şey əlavə olunubsa, bu ekran onu silməməlidir.
 */
export function parseLanguages(raw: string | null | undefined): ParsedLanguages {
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

/** Əsas dil dəstəklənənlərin içində olmalıdır, yoxsa agent heç bir dildə başlaya bilmir. */
export function serializeLanguages(
  defLang: string,
  supported: string[],
  extra: Record<string, unknown> = {},
): string {
  const langs = supported.includes(defLang) ? supported : [defLang, ...supported];
  return JSON.stringify({ ...extra, default: defLang, supported: langs });
}

/**
 * Əsas dil seçimi + dəstəklənən dillər üçün checkbox-lar.
 *
 * Nə üçün nə "def" nə "supported" öz vəziyyətini burada saxlamır (controlled): ConfigTab hər
 * dəyişiklikdə "yadda saxlanıldı" mesajını gizlətmək üçün əlavə iş görür (setDone(false)) — bu
 * yalnız çağıran tərəfin bilməli olduğu bir şeydir, paylaşılan komponentin yox.
 */
export function LanguagePicker({
  defLang,
  supported,
  onChangeDefLang,
  onToggleLanguage,
}: {
  defLang: string;
  supported: string[];
  onChangeDefLang: (code: string) => void;
  onToggleLanguage: (code: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <Select
        label="Əsas dil"
        help="Agent bu dildə başlayır."
        value={defLang}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChangeDefLang(e.target.value)}
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
                onChange={() => onToggleLanguage(l.code)}
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
  );
}
