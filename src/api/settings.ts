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

/**
 * Acarin tam deyerini geri qaytarir. Yalniz SUPER_ADMIN, ve her cagiris serverde loglanir —
 * ehtiyatli istifade olunmalidir, adeten hint kifayetdir.
 */
export async function revealSetting(key: string): Promise<string> {
  const { data } = await http.get<{ value: string }>(
    `/admin/settings/${encodeURIComponent(key)}/reveal`,
  );
  return data.value;
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

/** SMTP-nin doğrudan işlədiyini yoxlayır — ayarları saxlamaq bunu sübut etmir. */
export async function sendTestEmail(to: string): Promise<void> {
  await http.post("/admin/settings/test-email", { to });
}
