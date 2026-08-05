import axios from "axios";
import { API_URL } from "./client";

/**
 * Panel domeni backend-den gelir, kodda yazilmir.
 *
 * Sebeb: platforma hele sarkhan.az uzerindedir, voint.az alinanda kocecek. Domen
 * kodda olsaydi, kocurme iki tetbiqde suffiks axtarmaq + yeniden deploy demek olardi.
 * Bele ise Ayarlar sehifesinde bir sahedir.
 */
export interface PublicConfig {
  panelDomain: string;
}

/** Backend elcatan olmasa panel dagilmasin deye ehtiyat deyer. */
const FALLBACK: PublicConfig = { panelDomain: "voint.az" };

let cached: PublicConfig | null = null;

export async function getPublicConfig(): Promise<PublicConfig> {
  if (cached) return cached;
  try {
    const { data } = await axios.get<PublicConfig>(`${API_URL}/api/v1/public/config`, {
      timeout: 6000,
    });
    cached = data?.panelDomain ? data : FALLBACK;
  } catch {
    cached = FALLBACK;
  }
  return cached;
}
