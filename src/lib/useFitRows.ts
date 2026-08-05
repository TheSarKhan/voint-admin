import { useEffect, useState, type RefObject } from "react";

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

  useEffect(() => {
    if (!enabled) return;
    const body = bodyRef.current;
    if (!body) return;

    const measure = () => {
      // Gizli element (məsələn açılmamış tab) sıfır ölçü verir. Onu ölçmək cədvəli üç sətirə
      // salır və tab açılanda düzəlmir - ona görə görünməyəndə heç ölçmürük, aşağıdakı
      // ResizeObserver isə görünən anda özü yenidən çağırır.
      if (body.offsetParent === null) return;

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

    // Gizlidən görünənə keçid, şriftin gec yüklənməsi, yan panelin dəyişməsi - hamısı
    // elementin ölçüsünü dəyişir və hamısı yenidən ölçmək üçün səbəbdir.
    const observer = new ResizeObserver(measure);
    observer.observe(body);

    return () => {
      window.removeEventListener("resize", measure);
      observer.disconnect();
    };
  }, [bodyRef, enabled]);

  return rows;
}
