import { useEffect, useMemo, useRef } from "react";
import type { PermissionCatalog } from "../api/roles";
import { Table, TableContainer, TBody, TD, TH, THead, TR } from "./ui";

/**
 * Modulun bütün icazələrini birdən verən xana.
 *
 * "Yarımçıq" vəziyyəti HTML-də yalnız JS ilə qoyulur, ona görə ref lazımdır. Onsuz iki fərqli
 * hal — "heç biri seçilməyib" və "bir neçəsi seçilib" — eyni boş xana kimi görünür, yəni ekran
 * verilmiş icazəni gizlədir.
 */
function ModuleCheckbox({
  granted,
  total,
  disabled,
  label,
  onToggle,
}: {
  granted: number;
  total: number;
  disabled: boolean;
  label: string;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = granted > 0 && granted < total;
    }
  }, [granted, total]);

  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={`${label} — bütün icazələr`}
      checked={granted === total && total > 0}
      disabled={disabled}
      onChange={onToggle}
      className="h-4 w-4 shrink-0 cursor-pointer accent-accent disabled:cursor-not-allowed"
    />
  );
}

/**
 * Rol × resurs × əməliyyat matrisi.
 *
 * Sətir = resurs, sütun = əməliyyat. Xanaya toxunmaq icazəni verir və ya alır.
 * Yalnız VERİLƏN icazələr saxlanılır — xananın boş olması "qadağandır" deməkdir,
 * ona görə ayrıca "qadağan" vəziyyəti yoxdur və ola da bilməz.
 */
export function PermissionMatrix({
  catalog,
  value,
  onChange,
  /** Müəssisə rolu üçün platformaya aid resurslar gizlədilir — onlar orada mənasızdır. */
  scope,
  disabled = false,
}: {
  catalog: PermissionCatalog;
  value: Record<string, string[]>;
  onChange: (next: Record<string, string[]>) => void;
  scope: "platform" | "tenant";
  disabled?: boolean;
}) {
  const resources = useMemo(
    () =>
      catalog.resources.filter((r) => scope === "platform" || !r.platformOnly),
    [catalog.resources, scope],
  );

  const has = (resource: string, action: string) =>
    (value[resource] ?? []).includes(action);

  const toggle = (resource: string, action: string) => {
    if (disabled) return;
    const current = value[resource] ?? [];
    const next = current.includes(action)
      ? current.filter((a) => a !== action)
      : [...current, action];
    const copy = { ...value };
    if (next.length === 0) delete copy[resource];
    else copy[resource] = next;
    onChange(copy);
  };

  const rowAll = (resource: string) => {
    if (disabled) return;
    const all = catalog.actions.map((a) => a.value);
    const copy = { ...value };
    if ((value[resource] ?? []).length === all.length) delete copy[resource];
    else copy[resource] = all;
    onChange(copy);
  };

  return (
    // Oz qeyri-seffaf fonu var: yapisqan resurs sutunu altindan surusen xanalari ortmelidir,
    // bunun ucun de fonun arxadaki setirle eyni olmasi lazimdir - hem pencerede, hem cedvel icinde.
    <div className="rounded-md border border-border bg-surface">
      <TableContainer>
        <Table>
        <THead>
          {/* Resurs sutunu yerinde qalir: dar ekranda cedvel yana surusende ilk itecek sey
              sətrin nəyə aid olduğudur, ve o gedende qalan xanalar mənasını itirir. */}
          <TH className="sticky left-0 z-10 bg-surface">Resurs</TH>
          {catalog.actions.map((a) => (
            <TH key={a.value} className="text-center">
              {a.label}
            </TH>
          ))}
        </THead>
        <TBody>
          {resources.map((r) => {
            const granted = value[r.value] ?? [];
            return (
              <TR key={r.value}>
                <TD className="sticky left-0 z-10 whitespace-nowrap bg-surface font-medium text-fg">
                  <label className="flex cursor-pointer items-center gap-2.5">
                    <ModuleCheckbox
                      granted={granted.length}
                      total={catalog.actions.length}
                      disabled={disabled}
                      label={r.label}
                      onToggle={() => rowAll(r.value)}
                    />
                    <span>
                      {r.label}
                      {r.platformOnly && (
                        <span className="ml-2 text-xs text-fg-faint">platforma</span>
                      )}
                    </span>
                  </label>
                </TD>
                {catalog.actions.map((a) => (
                  <TD key={a.value} className="text-center">
                    <input
                      type="checkbox"
                      aria-label={`${r.label} · ${a.label}`}
                      checked={has(r.value, a.value)}
                      disabled={disabled}
                      onChange={() => toggle(r.value, a.value)}
                      className="h-4 w-4 cursor-pointer accent-accent disabled:cursor-not-allowed"
                    />
                  </TD>
                ))}
                <TD className="text-right">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => rowAll(r.value)}
                    className="text-xs text-fg-muted transition-colors hover:text-fg disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {granted.length === catalog.actions.length ? "təmizlə" : "seç"}
                  </button>
                </TD>
              </TR>
            );
          })}
          </TBody>
        </Table>
      </TableContainer>
    </div>
  );
}
