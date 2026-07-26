// Voint loqosu — "i" herfinin noqtesi evezine yuxari dogru genislenen uc ses dalgasi.
// Butun formalar 24x24 seebekede, stroke-based, currentColor — ikon sistemi ile eyni dildedir.
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/**
 * Ikon variant: uc dalga + govde. 24px ve boyuk olculer ucun
 * (sidebar, login, sosial sekiller).
 */
export const IconLogo = (props: IconProps) => (
  <svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.2}
    strokeLinecap="round"
    {...props}
  >
    <path d="M3.3 9.5 Q12 -0.5 20.7 9.5" />
    <path d="M6.4 11.3 Q12 4.8 17.6 11.3" />
    <path d="M9.4 13 Q12 10 14.6 13" />
    <path d="M12 16.4 L12 21.6" />
  </svg>
);

/**
 * Kicik olcu varianti: iki dalga. 20px-den asagida uc dalga bir-birine yapisir,
 * ona gore favicon ve sixiq yerlerde bu istifade olunur.
 */
export const IconLogoSmall = (props: IconProps) => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.8}
    strokeLinecap="round"
    {...props}
  >
    <path d="M4.6 10.75 Q12 2.25 19.4 10.75" />
    <path d="M9 13.25 Q12 9.75 15 13.25" />
    <path d="M12 16.6 L12 21.8" />
  </svg>
);

/** Yalniz dalgalar — soz-isare daxilinde "i"-nin ustune oturdulur. */
const WordmarkArcs = (props: IconProps) => (
  <svg
    viewBox="0 0 30 12"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.3}
    strokeLinecap="round"
    {...props}
  >
    <path d="M2.4 10.4 Q15 -3.4 27.6 10.4" />
    <path d="M7 11.2 Q15 2.4 23 11.2" />
    <path d="M11.6 12 Q15 8.2 18.4 12" />
  </svg>
);

interface WordmarkProps {
  /** Soz-isarenin font olcusu (CSS deyeri). Dalgalar buna gore olculenir. */
  size?: string;
  className?: string;
}

/**
 * Tam soz-isare: "Voint" + "i"-nin ustunde dalgalar.
 * Noqtesiz "ı" istifade olunur ki, dalgalarla noqte ust-uste dusmesin.
 */
export function Wordmark({ size = "1.5rem", className = "" }: WordmarkProps) {
  return (
    <span
      className={`inline-flex items-baseline font-semibold tracking-[-0.03em] leading-none whitespace-nowrap ${className}`}
      style={{ fontSize: size }}
      aria-label="Voint"
      role="img"
    >
      <span aria-hidden="true">Vo</span>
      <span aria-hidden="true" className="relative inline-block">
        ı
        <WordmarkArcs
          className="absolute left-1/2 -translate-x-1/2 overflow-visible"
          style={{ bottom: "1.02em", width: "0.95em", height: "0.38em" }}
        />
      </span>
      <span aria-hidden="true">nt</span>
    </span>
  );
}
