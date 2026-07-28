import { useMemo } from "react";
import type { PermissionCatalog } from "../api/roles";
import { Table, TableContainer, TBody, TD, TH, THead, TR } from "./ui";

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
    <TableContainer>
      <Table>
        <THead>
          <TH>Resurs</TH>
          {catalog.actions.map((a) => (
            <TH key={a.value} className="text-center">
              {a.label}
            </TH>
          ))}
          <TH className="text-right">Hamısı</TH>
        </THead>
        <TBody>
          {resources.map((r) => {
            const granted = value[r.value] ?? [];
            return (
              <TR key={r.value}>
                <TD className="whitespace-nowrap font-medium text-fg">
                  {r.label}
                  {r.platformOnly && (
                    <span className="ml-2 text-xs text-fg-faint">platforma</span>
                  )}
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
  );
}
