import { http } from "./client";
import type { ProviderHealth, SettingView } from "./types";

export async function listSettings(): Promise<SettingView[]> {
  const { data } = await http.get<SettingView[]>("/admin/settings");
  return data;
}

/**
 * Acari yadda saxlayir. Backend evvelce provayderde yoxlayir — islemeyen acar
 * bazaya hec vaxt catmir, ona gore 422 cavabi "acar seherdir" demekdir.
 * ElevenLabs acarlari eyni zamanda Vapi-ye oturulur (syncToVapi).
 */
export async function saveSetting(
  key: string,
  value: string,
  syncToVapi = true,
): Promise<SettingView[]> {
  const { data } = await http.put<SettingView[]>(
    `/admin/settings/${encodeURIComponent(key)}`,
    { value, syncToVapi },
  );
  return data;
}

/** Panel deyerini silir — ayar yeniden serverin konfiqurasiyasina qayidir. */
export async function clearSetting(key: string): Promise<SettingView[]> {
  const { data } = await http.delete<SettingView[]>(
    `/admin/settings/${encodeURIComponent(key)}`,
  );
  return data;
}

/** Taymeri gozlemeden butun provayderleri indi yoxlayir. */
export async function recheckProviders(): Promise<ProviderHealth[]> {
  const { data } = await http.post<ProviderHealth[]>("/admin/settings/recheck");
  return data;
}
