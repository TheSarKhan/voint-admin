/**
 * Paylasilan class sabitleri — butun kit bunlardan istifade edir.
 * Qayda: heç bir gradient, glow, neon, sherti animasiya yoxdur.
 * Fokus halqasi klaviatura ile isleyenler ucun mecburidir (a11y).
 */

/** Klaviatura fokusu — hər interaktiv elementde olmalidir. */
export const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-fg-muted focus-visible:ring-offset-0";

/** Sahə (input, select, textarea) ucun umumi gorunus. */
export const inputCls =
  "w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-fg placeholder:text-fg-faint outline-none transition-colors focus:border-border-strong focus-visible:ring-2 focus-visible:ring-fg-muted focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50";

/** Sehv vaziyyetinde sahə cercivesi. */
export const inputErrorCls = "border-err/60 focus:border-err";

/* Kohne kod ucun saxlanilan duyme class sabitleri (Button komponenti ile eyni gorunus). */
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-fg-muted focus-visible:ring-offset-0";

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-md border border-border-strong bg-surface-2 px-3.5 py-2 text-sm font-medium text-fg transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-fg-muted focus-visible:ring-offset-0";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-md border border-border px-3.5 py-2 text-sm font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg disabled:cursor-not-allowed disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-fg-muted focus-visible:ring-offset-0";

export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-md border border-err/40 px-3.5 py-2 text-sm font-medium text-err transition-colors hover:bg-err/10 disabled:cursor-not-allowed disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-fg-muted focus-visible:ring-offset-0";

/** Class-lari birlesdirmek ucun kicik komekci. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
