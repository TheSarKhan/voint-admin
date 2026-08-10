/**
 * Kicik sayda (2-4) segment ucun donut. Rengler status tonlarindandir (ok/warn/err/muted) —
 * bu app-da rengin yegane ise dusdyu yer status gostericileridir, ona gore kateqoriya ucun
 * ayrica bir palet icad etmirik. Legend hemise gorunur (rengin ozu heç vaxt teklikde meni
 * daşımır), her dilim strokeLinecap="round" ile qonşusundan ayrilir.
 */
export interface DonutSegment {
  label: string;
  value: number;
  /** Bu app-in --color-* teokenlerinden biri, mes. "--color-ok". */
  colorVar: string;
}

export function DonutChart({
  segments,
  size = 132,
  thickness = 16,
  centerLabel,
}: {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  /** Meselen "12 müəssisə" — dairenin ortasinda. */
  centerLabel?: string;
}) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = total > 0 ? 3 : 0;

  let offset = 0;
  const arcs = segments
    .filter((s) => s.value > 0)
    .map((s) => {
      const rawDash = (s.value / total) * circumference;
      const dash = Math.max(rawDash - gap, 0);
      const arc = { ...s, dash, offset };
      offset += rawDash;
      return arc;
    });

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={thickness}
          />
          {arcs.map((a, i) => (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={`var(${a.colorVar})`}
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeDasharray={`${a.dash} ${circumference - a.dash}`}
              strokeDashoffset={-a.offset}
            >
              <title>
                {a.label}: {a.value}
              </title>
            </circle>
          ))}
        </svg>
        {centerLabel && (
          <div className="absolute inset-0 flex items-center justify-center px-2 text-center text-xs text-fg-muted">
            {centerLabel}
          </div>
        )}
      </div>
      <ul className="space-y-1.5">
        {segments.map((s, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: `var(${s.colorVar})` }}
            />
            <span className="text-fg-muted">{s.label}</span>
            <span className="text-fg-faint">· {s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
