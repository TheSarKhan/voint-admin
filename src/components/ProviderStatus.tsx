import { useEffect, useState } from "react";
import { listProviderHealth } from "../api/usage";
import type { ProviderHealth } from "../api/types";
import { Card, StatusText } from "./ui";

const label: Record<ProviderHealth["status"], string> = {
  OK: "işləyir",
  DOWN: "sıradan çıxıb",
  NOT_CONFIGURED: "qurulmayıb",
};

const tone = {
  OK: "ok",
  DOWN: "err",
  NOT_CONFIGURED: "warn",
} as const;

/**
 * Zeng ucun lazim olan xarici xidmetlerin veziyyeti.
 *
 * Burada olmasinin sebebi var: ElevenLabs aciri xeberdarliqsiz legv olundu ve bunu ilk
 * bilen musteri oldu — sukut esitdi. Indi acar olende bu setir dolur, zeng gelmeden once.
 */
export function ProviderStatus() {
  const [rows, setRows] = useState<ProviderHealth[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      listProviderHealth()
        .then((d) => {
          if (!cancelled) {
            setRows(d);
            setFailed(false);
          }
        })
        .catch(() => {
          if (!cancelled) setFailed(true);
        });
    load();
    // Backend hər 5 dəqiqədən bir yoxlayır; burada bir az tez-tez soruşuruq ki,
    // səhifə açıq qalanda köhnə vəziyyət görünməsin.
    //
    // Arxa fondakı tab soruşmur: heç kim baxmayan ekranı yeniləmək üçün dəqiqədə bir sorğu
    // vermək mənasızdır — brauzer günlərlə açıq qala bilər. Tab yenidən görünəndə dərhal
    // bir dəfə soruşuruq ki, gözə köhnə vəziyyət dəyməsin.
    const tick = () => {
      if (!document.hidden) load();
    };
    const timer = setInterval(tick, 60_000);
    const onVisible = () => {
      if (!document.hidden) load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (failed || rows.length === 0) return null;

  const broken = rows.filter((r) => r.status === "DOWN");

  return (
    <Card className="px-5 py-4">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
        <span className="text-xs font-medium uppercase tracking-wide text-fg-muted">
          Xidmətlər
        </span>
        {rows.map((r) => (
          <span key={r.name} className="flex items-baseline gap-2">
            <span className="text-sm text-fg">{r.name}</span>
            <StatusText tone={tone[r.status]}>{label[r.status]}</StatusText>
          </span>
        ))}
      </div>
      {broken.length > 0 && (
        <p className="mt-3 border-t border-border pt-3 text-sm text-err">
          {broken.map((r) => `${r.name}: ${r.detail}`).join(" · ")}
        </p>
      )}
    </Card>
  );
}
