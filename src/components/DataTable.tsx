import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { IconSearch } from "./icons";
import {
  Card,
  Input,
  Pagination,
  Select,
  Spinner,
  Table,
  TableContainer,
  TableEmpty,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "./ui";

/**
 * Serverden idare olunan cedvel.
 *
 * Siralama, axtaris ve sehifeleme BACKEND-de olur — bu komponent yalniz veziyyeti saxlayir
 * ve deyisende yeniden sorgu verir. Sebeb: cedvelin bezi sutunlari (maya, qaime, marja)
 * hesablanmis deyerlerdir, brauzerde yalniz cari sehifeni siralamaq ise yalan netice verer —
 * istifadeci "en boyuk qaime" istedikde 20 setirin en boyuyunu gorer, hamisinin yox.
 */

export interface Column<T> {
  /** Backend-in sort acari. Verilmese sutun siralanmir. */
  key?: string;
  header: string;
  /** Setirin bu sutundaki gorunusu. */
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
  /** Reqem sutunlari ucun — reqemler alt-alta duz dussun. */
  numeric?: boolean;
  className?: string;
}

export interface PageResult<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  sort: string | null;
  direction: string | null;
}

export interface QueryState {
  q: string;
  page: number;
  size: number;
  sort: string | null;
  direction: "asc" | "desc";
}

const SIZES = [10, 20, 50, 100];

export function DataTable<T>({
  columns,
  fetchPage,
  rowKey,
  defaultSort,
  defaultDirection = "asc",
  searchable = true,
  searchPlaceholder = "Axtar…",
  emptyMessage = "Nəticə yoxdur",
  toolbar,
  /** Deyisdikde cedvel birinci sehifeden yeniden yuklenir (mes. ay secicisi). */
  resetKey,
  onRowClick,
}: {
  columns: Column<T>[];
  fetchPage: (state: QueryState) => Promise<PageResult<T>>;
  rowKey: (row: T) => string;
  defaultSort?: string;
  defaultDirection?: "asc" | "desc";
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  toolbar?: ReactNode;
  resetKey?: string | number;
  /**
   * Setire klikledikde cagirilir. Sutunun icindeki linki EVEZ ETMIR, ustune gelir: link
   * klaviatura ile gezmeye, orta duyme ile yeni tabda acmaga ve unvani kopyalamaga imkan verir —
   * bunlarin hec biri klik hadisesi ile alinmir.
   */
  onRowClick?: (row: T) => void;
}) {
  const [rawQuery, setRawQuery] = useState("");
  const [state, setState] = useState<QueryState>({
    q: "",
    page: 0,
    size: 20,
    sort: defaultSort ?? null,
    direction: defaultDirection,
  });
  const [result, setResult] = useState<PageResult<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Her herfde sorgu gondermek serveri lazimsiz yorur; yazib bitirene qeder gozleyirik.
  useEffect(() => {
    const timer = setTimeout(() => {
      setState((s) => (s.q === rawQuery ? s : { ...s, q: rawQuery, page: 0 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [rawQuery]);

  // Xarici filtr (ay ve s.) deyisdikde birinci sehifeye qayit.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setState((s) => ({ ...s, page: 0 }));
  }, [resetKey]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPage(state)
      .then((r) => {
        if (!cancelled) setResult(r);
      })
      .catch(() => {
        if (!cancelled) setError("Məlumat yüklənmədi.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // fetchPage her render-de yeni funksiya ola biler; asili etsek sonsuz dovreye dusur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, resetKey]);

  const toggleSort = (key: string) => {
    setState((s) =>
      s.sort === key
        ? { ...s, direction: s.direction === "asc" ? "desc" : "asc", page: 0 }
        : { ...s, sort: key, direction: "asc", page: 0 },
    );
  };

  const total = result?.totalElements ?? 0;
  const shown = result?.content.length ?? 0;
  const from = total === 0 ? 0 : state.page * state.size + 1;

  const totalLabel = useMemo(() => {
    if (total === 0) return "";
    return `${from}–${from + shown - 1} / ${total}`;
  }, [from, shown, total]);

  return (
    <Card>
      {(searchable || toolbar) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
          {searchable ? (
            <Input
              icon={IconSearch}
              value={rawQuery}
              onChange={(e) => setRawQuery(e.target.value)}
              placeholder={searchPlaceholder}
              containerClassName="w-full max-w-xs"
              aria-label="Axtarış"
            />
          ) : (
            <span />
          )}
          {toolbar}
        </div>
      )}

      <TableContainer>
        <Table>
          {/* THead oz <tr>-ini ozu qurur — buraya bir de <TR> qoysaq <tr><tr><th> alinir
              ve brauzer onu yenidən duzəldərkən sutunlar bir-birine uygunlasmir. */}
          <THead>
            {columns.map((col) => (
              <TH
                key={col.header}
                sortable={Boolean(col.key)}
                sortDir={col.key && state.sort === col.key ? state.direction : null}
                onSort={col.key ? () => toggleSort(col.key!) : undefined}
                className={col.align === "right" ? "text-right" : undefined}
              >
                {col.header}
              </TH>
            ))}
          </THead>
          <TBody>
            {loading && !result ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-10">
                  <Spinner />
                </td>
              </tr>
            ) : error ? (
              <TableEmpty colSpan={columns.length} message={error} />
            ) : shown === 0 ? (
              <TableEmpty
                colSpan={columns.length}
                message={state.q ? `"${state.q}" üçün nəticə yoxdur` : emptyMessage}
              />
            ) : (
              result!.content.map((row) => (
                <TR
                  key={rowKey(row)}
                  className={onRowClick ? "cursor-pointer" : undefined}
                  onClick={
                    onRowClick
                      ? (e) => {
                          // Setirin icindeki link/duyme oz isini gorsun - iki defe islemesin.
                          if ((e.target as HTMLElement).closest("a,button,input,select,label")) {
                            return;
                          }
                          // Metn secmek ucun suruşdurəndə sehife deyismemelidir.
                          if (window.getSelection()?.toString()) {
                            return;
                          }
                          onRowClick(row);
                        }
                      : undefined
                  }
                >
                  {columns.map((col) => (
                    <TD
                      key={col.header}
                      className={[
                        col.align === "right" ? "text-right" : "",
                        col.numeric ? "tabular-nums whitespace-nowrap" : "",
                        col.className ?? "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {col.cell(row)}
                    </TD>
                  ))}
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </TableContainer>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-fg-faint">{totalLabel}</span>
          <Select
            aria-label="Səhifə ölçüsü"
            value={String(state.size)}
            onChange={(e) =>
              setState((s) => ({ ...s, size: Number(e.target.value), page: 0 }))
            }
            options={SIZES.map((n) => ({ value: String(n), label: `${n} sətir` }))}
            containerClassName="w-28"
          />
        </div>
        {/* Pagination 1-den baslayir, backend 0-dan — cevirme burada olur. */}
        <Pagination
          page={state.page + 1}
          pageCount={result?.totalPages ?? 1}
          onChange={(p) => setState((s) => ({ ...s, page: p - 1 }))}
        />
      </div>
    </Card>
  );
}
