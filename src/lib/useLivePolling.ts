import { useEffect, useRef } from "react";

/**
 * Bir yükləmə funksiyasını dərhal, sonra hər {@link intervalMs}-də bir çağırır.
 *
 * Arxa fondakı tab soruşmur: heç kim baxmayan ekranı yeniləmək üçün müntəzəm sorğu vermək
 * mənasızdır — brauzer günlərlə açıq qala bilər. Tab yenidən görünəndə dərhal bir dəfə
 * soruşulur ki, gözə köhnə vəziyyət dəyməsin (bax ProviderStatus.tsx — bu hook elə oradakı
 * naxışın çıxarılmış halıdır).
 *
 * {@code load} hər render-də təzələnən bir ref-də saxlanılır, effektin özündə yox — əks halda
 * çağıran tərəf onu {@code useCallback}-siz versə, interval mount anındakı köhnə closure-a
 * kilidlənərdi və təzə state-i heç vaxt görməzdi.
 */
export function useLivePolling(load: () => void, intervalMs = 60_000): void {
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    loadRef.current();
    const tick = () => {
      if (!document.hidden) loadRef.current();
    };
    const timer = setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [intervalMs]);
}
