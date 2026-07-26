export function formatDuration(sec: number): string {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("az-AZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("az-AZ", {
    day: "2-digit",
    month: "2-digit",
  });
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

/** "2026-07" -> "İyul 2026" */
export function formatMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  return new Date(y, m - 1, 1).toLocaleDateString("az-AZ", {
    month: "long",
    year: "numeric",
  });
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
