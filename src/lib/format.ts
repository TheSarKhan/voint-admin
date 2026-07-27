/**
 * Tarix formatlari — platforma qaydasi: BUTUN tarixler dd.mm.yyyy.
 *
 * toLocaleDateString("az-AZ") ISLEDILMIR ve bu qesdendir: az-AZ locale melumati
 * brauzerden brauzere deyisir, ICU qurulusunda olmayanda sessizce defolt locale-a
 * dusur ve tarix "7/27/2026" kimi cixa biler. Standart mecburi oldugu ucun formati
 * burada acig-aydin quraq — hansi brauzerde acilmasindan asili olmasin.
 */

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Xarab ve ya bos tarix — panelde "Invalid Date" gostermekdense tire. */
function parse(iso: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** dd.mm.yyyy */
export function formatDate(iso: string): string {
  const d = parse(iso);
  if (!d) return "—";
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/** dd.mm.yyyy hh:mm */
export function formatDateTime(iso: string): string {
  const d = parse(iso);
  if (!d) return "—";
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

/**
 * Yalniz qrafik oxu ucun qisa forma: gun.ay.
 * 7 sutunun altinda tam tarix yazsaq etiketler ust-uste dusur; tam tarix
 * sutunun tooltip-inde qalir, yeni oxunan yerde standart pozulmur.
 */
export function formatDayShort(iso: string): string {
  const d = parse(iso);
  if (!d) return "—";
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`;
}

/** Ayin son gunu — qaimenin tarixi. dd.mm.yyyy */
export function monthEndDate(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return "—";
  const d = new Date(y, m, 0);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export function formatDuration(sec: number): string {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

/** Meblegi AZN kimi yazir: 1234.5 -> "1 234,50 ₼" */
export function formatMoney(azn: number): string {
  return `${azn.toLocaleString("az-AZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ₼`;
}

/** Boyuk saylari oxunaqli edir: 1234567 -> "1 234 567" */
export function formatNumber(n: number): string {
  return n.toLocaleString("az-AZ");
}

/** Deqiqeni bir onluq reqemle: 523.4 -> "523,4 dəq" */
export function formatMinutes(min: number): string {
  return `${min.toLocaleString("az-AZ", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} dəq`;
}

/**
 * Ay adlari da elde yazilib, tarixlerle eyni sebebden: locale-a buraxsaq az-AZ
 * olmayan brauzerde "July 2026" cixir.
 */
const MONTHS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun",
  "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
];

/** "2026-07" -> "İyul 2026" */
export function formatMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) return ym;
  return `${MONTHS[m - 1]} ${y}`;
}

/** Bu ayin "YYYY-MM" formati (brauzerin yerli vaxti ile). */
export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Secilebilen son N ay, yenisi evvelde. */
export function recentMonths(count = 12): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < count; i++) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}
