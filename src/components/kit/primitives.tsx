/**
 * Voint UI kit — struktur ve gorunus primitivleri.
 * Monoxrom, dark-first, sakit. Gradient/glow/emoji/animasiyali nisan yoxdur.
 * Status heç vaxt cercive ve ya fon icinde gosterilmir — yalniz sade rengli metn.
 */
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ComponentPropsWithoutRef,
  type ComponentType,
  type ReactNode,
  type SVGProps,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from "react";
import {
  IconCheckCircle,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconClose,
  IconErrorCircle,
  IconInfo,
  IconWarning,
} from "../icons";
import { cx, focusRing } from "./styles";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

/* ================================================================== */
/* Seyfe basligi                                                       */
/* ================================================================== */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-fg">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-fg-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ================================================================== */
/* Card                                                                */
/* ================================================================== */

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-border bg-surface ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
      <div>
        <h2 className="text-sm font-semibold text-fg">{title}</h2>
        {description && (
          <p className="mt-1 text-xs text-fg-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

export function CardFooter({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-end gap-2 border-t border-border px-5 py-3 ${className}`}
    >
      {children}
    </div>
  );
}

/* ================================================================== */
/* Divider                                                             */
/* ================================================================== */

export function Divider({
  vertical = false,
  className = "",
}: {
  vertical?: boolean;
  className?: string;
}) {
  if (vertical) {
    return (
      <span
        aria-hidden="true"
        className={`inline-block w-px self-stretch bg-border ${className}`}
      />
    );
  }
  return <hr className={`border-0 border-t border-border ${className}`} />;
}

/* ================================================================== */
/* Status — sade rengli metn, heç bir cercive/fon yoxdur                */
/* ================================================================== */

export type StatusTone = "neutral" | "ok" | "warn" | "err";

const statusToneCls: Record<StatusTone, string> = {
  neutral: "text-fg-muted",
  ok: "text-ok",
  warn: "text-warn",
  err: "text-err",
};

/**
 * Status gostericisi. Yalniz metn — nişan, çip, etiket qutusu yoxdur.
 * Animasiya ve ya yanib-sonen noqte de yoxdur.
 */
export function StatusText({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: StatusTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "text-[11px] font-medium uppercase tracking-[0.07em]",
        statusToneCls[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ================================================================== */
/* Button                                                              */
/* ================================================================== */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

const variantCls: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-fg hover:opacity-90",
  secondary:
    "border border-border-strong bg-surface-2 text-fg hover:bg-surface",
  ghost:
    "border border-border text-fg-muted hover:border-border-strong hover:text-fg",
  danger: "border border-err/40 text-err hover:bg-err/10",
};

const sizeCls: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-9 px-3.5 text-sm",
};

const iconOnlySizeCls: Record<ButtonSize, string> = {
  sm: "h-8 w-8 p-0",
  md: "h-9 w-9 p-0",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Yalniz ikon — kvadrat forma. `aria-label` mecburidir. */
  iconOnly?: boolean;
  icon?: IconComponent;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  iconOnly = false,
  icon: Icon,
  disabled,
  children,
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  const iconSize = size === "sm" ? 14 : 15;
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cx(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variantCls[variant],
        iconOnly ? iconOnlySizeCls[size] : sizeCls[size],
        focusRing,
        className,
      )}
      {...rest}
    >
      {loading ? (
        <InlineSpinner size={iconSize} />
      ) : (
        Icon && <Icon width={iconSize} height={iconSize} />
      )}
      {!iconOnly && children}
    </button>
  );
}

/* ================================================================== */
/* Spinner                                                             */
/* ================================================================== */

export function InlineSpinner({ size = 14 }: { size?: number }) {
  return (
    <span
      role="status"
      aria-label="Yüklənir"
      className="inline-block shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
      style={{ width: size, height: size }}
    />
  );
}

export function Spinner({
  label = "Yüklənir…",
  compact = false,
}: {
  label?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cx(
        "flex items-center justify-center",
        compact ? "py-6" : "py-16",
      )}
      role="status"
      aria-label={label}
    >
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-border-strong border-t-fg" />
    </div>
  );
}

/* ================================================================== */
/* Skeleton — statik, yanib-sonmur                                     */
/* ================================================================== */

export function Skeleton({
  className = "",
  width,
  height,
}: {
  className?: string;
  width?: string | number;
  height?: string | number;
}) {
  return (
    <span
      aria-hidden="true"
      className={cx("block rounded-md bg-surface-2", className)}
      style={{ width, height: height ?? (className ? undefined : 12) }}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cx("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={10}
          className={i === lines - 1 ? "w-2/3" : "w-full"}
        />
      ))}
    </div>
  );
}

/* ================================================================== */
/* EmptyState                                                          */
/* ================================================================== */

export function EmptyState({
  message,
  title,
  icon: Icon,
  action,
}: {
  message: string;
  title?: string;
  icon?: IconComponent;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {Icon && (
        <Icon width={28} height={28} className="mb-3 text-fg-faint" />
      )}
      {title && (
        <p className="mb-1 text-sm font-medium text-fg">{title}</p>
      )}
      <p className="max-w-md text-sm text-fg-muted">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ================================================================== */
/* Alert / Callout                                                     */
/* ================================================================== */

export type AlertTone = "info" | "warn" | "err" | "ok";

const alertMeta: Record<AlertTone, { cls: string; icon: IconComponent }> = {
  info: { cls: "border-border-strong text-fg-muted", icon: IconInfo },
  ok: { cls: "border-ok/40 bg-ok/[0.07] text-ok", icon: IconCheckCircle },
  warn: { cls: "border-warn/40 bg-warn/[0.07] text-warn", icon: IconWarning },
  err: { cls: "border-err/40 bg-err/[0.07] text-err", icon: IconErrorCircle },
};

export function Alert({
  tone = "info",
  title,
  children,
  onDismiss,
}: {
  tone?: AlertTone;
  title?: string;
  children?: ReactNode;
  onDismiss?: () => void;
}) {
  const meta = alertMeta[tone];
  const Icon = meta.icon;
  return (
    <div
      role={tone === "err" ? "alert" : "status"}
      className={cx(
        "flex items-start gap-3 rounded-md border px-3.5 py-3 text-sm",
        meta.cls,
      )}
    >
      <Icon width={16} height={16} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && (
          <div className={cx("text-sm", title && "mt-0.5 opacity-90")}>
            {children}
          </div>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Bağla"
          className={cx(
            "-mr-1 shrink-0 rounded p-0.5 opacity-70 transition-opacity hover:opacity-100",
            focusRing,
          )}
        >
          <IconClose width={14} height={14} />
        </button>
      )}
    </div>
  );
}

/* ================================================================== */
/* Table                                                               */
/* ================================================================== */

export function TableContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cx("overflow-x-auto", className)}>{children}</div>;
}

export function Table({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <table className={cx("w-full text-left text-sm", className)}>
      {children}
    </table>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-border text-xs uppercase tracking-wide text-fg-faint">
        {children}
      </tr>
    </thead>
  );
}

export type SortDirection = "asc" | "desc" | null;

export interface THProps extends ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sortDir?: SortDirection;
  onSort?: () => void;
}

export function TH({
  sortable = false,
  sortDir = null,
  onSort,
  children,
  className = "",
  ...rest
}: THProps) {
  return (
    <th
      scope="col"
      aria-sort={
        !sortable ? undefined : sortDir === "asc"
          ? "ascending"
          : sortDir === "desc"
            ? "descending"
            : "none"
      }
      className={cx("whitespace-nowrap px-5 py-3 font-medium", className)}
      {...rest}
    >
      {sortable ? (
        <button
          type="button"
          onClick={onSort}
          className={cx(
            "inline-flex items-center gap-1 rounded uppercase tracking-wide transition-colors hover:text-fg",
            sortDir ? "text-fg" : "",
            focusRing,
          )}
        >
          {children}
          {sortDir === "asc" ? (
            <IconChevronUp width={12} height={12} />
          ) : sortDir === "desc" ? (
            <IconChevronDown width={12} height={12} />
          ) : (
            <IconChevronDown width={12} height={12} className="opacity-40" />
          )}
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TR({
  children,
  className = "",
  ...rest
}: ComponentPropsWithoutRef<"tr">) {
  return (
    <tr
      className={cx(
        "border-b border-border/60 last:border-0 hover:bg-surface-2/60",
        className,
      )}
      {...rest}
    >
      {children}
    </tr>
  );
}

export function TD({
  children,
  className = "",
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cx("px-5 py-3", className)} {...rest}>
      {children}
    </td>
  );
}

export function TableEmpty({
  colSpan,
  message,
}: {
  colSpan: number;
  message: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5">
        <EmptyState message={message} />
      </td>
    </tr>
  );
}

/* ================================================================== */
/* Tabs                                                                */
/* ================================================================== */

export interface TabItem {
  value: string;
  label: string;
  count?: number;
}

export function Tabs({
  items,
  value,
  onChange,
  className = "",
}: {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cx("flex items-center gap-1 border-b border-border", className)}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cx(
              "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
              active
                ? "border-fg font-medium text-fg"
                : "border-transparent text-fg-muted hover:text-fg",
              focusRing,
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className="ml-1.5 text-xs text-fg-faint">{item.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ================================================================== */
/* Tooltip                                                             */
/* ================================================================== */

export function Tooltip({
  label,
  children,
  side = "top",
}: {
  label: string;
  children: ReactNode;
  side?: "top" | "bottom";
}) {
  const id = useId();
  return (
    <span className="group relative inline-flex">
      <span aria-describedby={id} className="inline-flex">
        {children}
      </span>
      <span
        role="tooltip"
        id={id}
        className={cx(
          "pointer-events-none invisible absolute left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-md border border-border-strong bg-surface-2 px-2 py-1 text-xs text-fg opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100",
          side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5",
        )}
      >
        {label}
      </span>
    </span>
  );
}

/* ================================================================== */
/* DropdownMenu                                                        */
/* ================================================================== */

export interface DropdownItem {
  label: string;
  onSelect: () => void;
  icon?: IconComponent;
  danger?: boolean;
  disabled?: boolean;
}

export function DropdownMenu({
  trigger,
  items,
  align = "right",
}: {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative inline-block" ref={rootRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cx("inline-flex rounded-md", focusRing)}
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={cx(
            "absolute z-40 mt-1 min-w-44 rounded-md border border-border bg-surface py-1 shadow-xl",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={cx(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                  item.danger
                    ? "text-err hover:bg-err/10"
                    : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                  focusRing,
                )}
              >
                {Icon && <Icon width={14} height={14} />}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/* Pagination                                                          */
/* ================================================================== */

function pageList(page: number, pageCount: number): Array<number | "gap"> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const out: Array<number | "gap"> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  if (start > 2) out.push("gap");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < pageCount - 1) out.push("gap");
  out.push(pageCount);
  return out;
}

/**
 * Yalniz sehife duymeleri. Cercive, doldurma ve "1-20 / 340" etiketi QESDEN yoxdur —
 * onlari saxlayan konteyner teyin edir, yoxsa cedvelin altinda cut sərhəd cixir.
 */
export function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;
  const itemCls =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <nav aria-label="Səhifələmə" className="flex items-center gap-1">
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Əvvəlki səhifə"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className={cx(itemCls, "text-fg-muted hover:text-fg", focusRing)}
        >
          <IconChevronLeft width={15} height={15} />
        </button>
        {pageList(page, pageCount).map((p, i) =>
          p === "gap" ? (
            <span key={`gap-${i}`} className="px-1 text-sm text-fg-faint">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              aria-current={p === page ? "page" : undefined}
              onClick={() => onChange(p)}
              className={cx(
                itemCls,
                p === page
                  ? "border border-border-strong bg-surface-2 font-medium text-fg"
                  : "text-fg-muted hover:text-fg",
                focusRing,
              )}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          aria-label="Növbəti səhifə"
          disabled={page >= pageCount}
          onClick={() => onChange(page + 1)}
          className={cx(itemCls, "text-fg-muted hover:text-fg", focusRing)}
        >
          <IconChevronRight width={15} height={15} />
        </button>
      </div>
    </nav>
  );
}

/* ================================================================== */
/* Modal — fokus tələsi + Escape                                       */
/* ================================================================== */

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Modal({
  title,
  onClose,
  children,
  footer,
  size = "md",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const trapFocus = useCallback((e: KeyboardEvent) => {
    const panel = panelRef.current;
    if (!panel) return;
    const nodes = Array.from(
      panel.querySelectorAll<HTMLElement>(FOCUSABLE),
    ).filter((el) => el.offsetParent !== null);
    if (nodes.length === 0) {
      e.preventDefault();
      return;
    }
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey && (active === first || !panel.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      } else if (e.key === "Tab") {
        trapFocus(e);
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose, trapFocus]);

  const maxW =
    size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-2xl" : "max-w-lg";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx(
          "max-h-[90vh] w-full overflow-y-auto rounded-lg border border-border bg-surface p-6 shadow-xl outline-none",
          maxW,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-base font-semibold text-fg">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={cx(
              "-mr-1 -mt-0.5 rounded p-1 text-fg-muted transition-colors hover:text-fg",
              focusRing,
            )}
            aria-label="Bağla"
          >
            <IconClose width={16} height={16} />
          </button>
        </div>
        {children}
        {footer && (
          <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/* StatCard                                                            */
/* ================================================================== */

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
