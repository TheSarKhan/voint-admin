import { Card } from "./ui";

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-fg">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-fg-faint">{hint}</p>}
    </Card>
  );
}
