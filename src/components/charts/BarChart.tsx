/**
 * Sade, tek-seriyali sutun qrafiki: hover-de deyer gorunur, altda qisa etiket, native
 * `title` isarasi ikinci bir tooltip qatı kimi. Ranq bir tondur (categorical yox, magnitude) —
 * bu app-in monoxrom dizaynina uygun, ayri rengler lazim deyil.
 */
export interface BarChartDatum {
  label: string;
  value: number;
  tooltip?: string;
}

export function BarChart({
  data,
  formatValue = (v: number) => String(v),
}: {
  data: BarChartDatum[];
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex h-48 items-end gap-3">
      {data.map((d, i) => {
        const h = Math.max((d.value / max) * 100, 4);
        return (
          <div key={i} className="group flex flex-1 flex-col items-center gap-2">
            <span className="text-xs text-fg-muted opacity-0 transition-opacity group-hover:opacity-100">
              {formatValue(d.value)}
            </span>
            <div
              className="w-full rounded-t-sm bg-border-strong transition-colors group-hover:bg-fg-muted"
              style={{ height: `${h}%` }}
              title={d.tooltip ?? `${d.label}: ${formatValue(d.value)}`}
            />
            <span className="text-[11px] text-fg-faint">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
