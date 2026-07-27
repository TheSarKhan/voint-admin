// Voint loqosu — "Voint" soz-isaresi + "t" herfinin sag-yuxarisinda uc ic-ice yasil arc.
//
// Neden PNG deyil: brend fayllari 1786px enindedir ve eninin yarisi bos sahedir — 20px-lik
// sidebar-da hem yumsaq gorunur, hem de lazimsiz agirliq getirir. Burada eyni loqo vektor
// kimi qurulub: her olcude iti qalir.
//
// Renge uygunlasma: soz-isare `currentColor` ile yazilir, arclar HEMISE yasil qalir.
// Qara temada ag metn + yasil arc ("Dark" fayli), isiqli temada qara metn + yasil arc
// ("White" fayli). Iki ayri fayl deyil — bir komponent, fona gore ozu uygunlasir.
import type { CSSProperties, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/** Brend yasili. YALNIZ arclar ucun — metn kimi ag fonda oxunmur (kontrast 1.36:1). */
const BRAND = "#39FF14";

/**
 * Uc konsentrik arc: asagi-soldaki merkezden yuxari-saga yayilan siqnal dalgalari.
 * Radiuslar 8/14/20, hamisi eyni merkezden — loqodaki nisbet.
 */
export const BrandArcs = ({ style, ...props }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={BRAND}
    strokeWidth={1.9}
    strokeLinecap="round"
    style={{ overflow: "visible", ...style }}
    {...props}
  >
    <path d="M2.39 15.12 A8 8 0 0 1 8.97 22.30" />
    <path d="M3.44 9.21 A14 14 0 0 1 14.94 21.78" />
    <path d="M4.48 3.30 A20 20 0 0 1 20.92 21.26" />
  </svg>
);

/**
 * Ikon variant — yalniz arclar, sozsuz. Favicon ve sixiq yerler ucun:
 * bu olculerde soz-isare onsuz da oxunmur, isare kimi arclar qalir.
 */
export const IconLogo = (props: IconProps) => (
  <BrandArcs width={24} height={24} {...props} />
);

/** Kicik olcu: en kicik arc atilir, cunki 16px-de uc arc bir-birine yapisir. */
export const IconLogoSmall = ({ style, ...props }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={BRAND}
    strokeWidth={2.6}
    strokeLinecap="round"
    width={16}
    height={16}
    style={{ overflow: "visible", ...style }}
    {...props}
  >
    <path d="M3.44 9.21 A14 14 0 0 1 14.94 21.78" />
    <path d="M4.48 3.30 A20 20 0 0 1 20.92 21.26" />
  </svg>
);

interface WordmarkProps {
  /** Soz-isarenin font olcusu (CSS deyeri). Arclar buna gore olculenir. */
  size?: string;
  className?: string;
  style?: CSSProperties;
}

/** Tam soz-isare: "Voint" + "t"-nin sag-yuxarisinda yasil arclar. */
export function Wordmark({ size = "1.5rem", className = "", style }: WordmarkProps) {
  return (
    <span
      className={`inline-block font-semibold tracking-[-0.03em] leading-none whitespace-nowrap ${className}`}
      style={{ fontSize: size, ...style }}
      aria-label="Voint"
      role="img"
    >
      <span aria-hidden="true" className="relative inline-block">
        Voint
        {/* Arclar "t"-nin ustune, sag kenardan bir az iceri oturur — loqodaki kimi. */}
        <BrandArcs
          className="absolute"
          style={{
            left: "100%",
            bottom: "0.30em",
            marginLeft: "-0.10em",
            width: "0.52em",
            height: "0.52em",
          }}
        />
      </span>
    </span>
  );
}
