import { useEffect, useLayoutEffect, useState, type RefObject } from "react";

/** Bir cədvəl sətrinin təxmini hündürlüyü (px-5 py-3 + text-sm). Ölçü alınana qədər istifadə olunur. */
const FALLBACK_ROW_HEIGHT = 45;

/** Cədvəldən aşağıda qalan sabit hissə: səhifələmə zolağı + səhifənin alt boşluğu. */
const RESERVED_BELOW = 96;

/** Ekran çox alçaq olsa belə cədvəl bir neçə sətir göstərməlidir. */
const MIN_ROWS = 3;

/**
 * Ekrana sığan sətir sayını hesablayır.
 *
 * <p>Nə üçün sabit rəqəm yox: 20 sətir bir monitorda ekranı aşır, digərində yarısını boş qoyur.
 * "İlk açılanda scroll olmasın" tələbi ekranın özündən asılıdır, ona görə ölçü də oradan alınır.
 *
 * <p>Ölçü cədvəl GÖVDƏSİNİN yuxarı kənarından götürülür. Bu nöqtə sətir sayından asılı deyil
 * (sətirlər ondan aşağıdadır), yəni hesablama öz nəticəsini dəyişmir — əks halda sətir sayı
 * hündürlüyü, hündürlük də sətir sayını dəyişib sonsuz döngə yaradardı.
 *
 * @param bodyRef cədvəl gövdəsi (tbody) — ölçü onun yuxarı kənarından başlayır
 * @param enabled false olanda hesablama aparılmır (məsələn siyahı hələ yüklənməyib)
 */
export function useFitRows(
  bodyRef: RefObject<HTMLElement | null>,
  enabled = true,
): number | null {
  const [rows, setRows] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!enabled) return;

    const measure = () => {
      const body = bodyRef.current;
      if (!body) return;

      const top = body.getBoundingClientRect().top;
      // Mövcud sətirdən həqiqi hündürlüyü götür — şrift və ya doldurma dəyişsə,
      // sabit rəqəm səhvə düşərdi.
      const firstRow = body.querySelector("tr");
      const rowHeight = firstRow?.getBoundingClientRect().height || FALLBACK_ROW_HEIGHT;

      const available = window.innerHeight - top - RESERVED_BELOW;
      setRows(Math.max(MIN_ROWS, Math.floor(available / rowHeight)));
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [bodyRef, enabled]);

  // Şriftlər gec yüklənəndə sətir hündürlüyü dəyişir; bir dəfə yenidən ölçürük.
  useEffect(() => {
    if (!enabled || !document.fonts) return;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      const body = bodyRef.current;
      if (!body) return;
      const top = body.getBoundingClientRect().top;
      const firstRow = body.querySelector("tr");
      const rowHeight = firstRow?.getBoundingClientRect().height || FALLBACK_ROW_HEIGHT;
      setRows(Math.max(MIN_ROWS, Math.floor((window.innerHeight - top - RESERVED_BELOW) / rowHeight)));
    });
    return () => {
      cancelled = true;
    };
  }, [bodyRef, enabled]);

  return rows;
}
