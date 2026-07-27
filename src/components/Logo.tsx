// Voint loqosu — "Voint." soz-isaresi + "t" herfinin sag-yuxarisinda uc ic-ice yasil arc.
//
// Neden PNG deyil: brend fayllari 1786px enindedir ve eninin yarisi bos kenardir — 20px-lik
// sidebar-da hem yumsaq gorunur, hem de lazimsiz agirliq getirir. Vektor her olcude iti qalir.
//
// Renge uygunlasma: soz-isare `currentColor` ile yazilir, arclar HEMISE yasil qalir.
// Qara temada ag metn + yasil arc ("Dark" fayli), isiqli fonda qara metn + yasil arc
// ("White" fayli). Iki ayri fayl deyil — bir komponent, fona gore ozu uygunlasir.
import type { CSSProperties, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/** Brend yasili. YALNIZ arclar ucun — metn kimi ag fonda oxunmur (kontrast 1.36:1). */
const BRAND = "#39FF14";

/**
 * Uc konsentrik arc: asagi-soldaki merkezden yuxari-saga yayilan siqnal dalgalari.
 * Radiuslar 8/14/20, hamisi eyni merkezden — brend faylindaki nisbet.
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

/**
 * Tam soz-isare: "Voint." + "t"-nin sag-yuxarisinda yasil arclar.
 *
 * Arclar butun sozun deyil, MEHZ "t"-nin yaninda dayanir — ona gore "t" ayrica span-dedir.
 * Sonda nöqte var, arclar ise onun ustunden asir; belə olmasa nöqte elave olunanda arclar
 * sağa surusherdi.
 *
 * Olculer brend faylindan cixarilib: orada cap hundurluyu ~240px, arc qrupu ~140x150px,
 * arcin alt kenari bazadan ~150px yuxarida ve sol kenari "t"-nin sag kenarindan ~45px
 * iceridedir. Poppins-de cap hundurluyu ~0.70em oldugu ucun bunlar asagidaki em deyerleridir.
 */
export function Wordmark({ size = "1.5rem", className = "", style }: WordmarkProps) {
  return (
    <span
      className={`inline-block font-semibold tracking-[-0.03em] leading-none whitespace-nowrap ${className}`}
      // Arclarin zirvesi cap hundurluyunden yuxaridir; leading-none ile setir qutusu 1em
      // oldugu ucun yer ayrilmasa yuxaridaki elementle ust-uste dusurler.
      style={{ fontSize: size, paddingTop: "0.2em", ...style }}
      aria-label="Voint"
      role="img"
    >
      <span aria-hidden="true">Voin</span>
      <span aria-hidden="true" className="relative inline-block">
        t
        <BrandArcs
          className="absolute"
          style={{
            // Brend faylindan olculub: baza xetti y=305, cap hundurluyu 177px -> ~253px font.
            // Arc qrupu y=85..195 => bazadan 0.44em yuxarida baslayir, 0.44em hundurluyunde;
            // sol kenari ise "t"-nin sag kenarina yapisir, herfin UZERINE minmir.
            left: "100%",
            marginLeft: "-0.03em",
            bottom: "0.44em",
            width: "0.40em",
            height: "0.44em",
          }}
        />
      </span>
      <span aria-hidden="true">.</span>
    </span>
  );
}
