import { useAuthStore } from "../store/auth";

/**
 * Cari istifadəçinin bu resurs+əməliyyata icazəsi varmı — nav/düymələr göstərilməzdən əvvəl.
 *
 * Bu, TƏHLÜKƏSİZLİK SƏRHƏDI DEYİL — backend hər sorğunu özü ayrıca yoxlayır (bax
 * PermissionInterceptor), bu sadəcə "klikləyəndə 403 alacağın bir düyməni ümumiyyətlə
 * göstərmə" səviyyəsindədir.
 *
 * `permissions` yüklənməyibsə (köhnə, `/auth/me`-ni hələ yeniləməmiş sessiya) icazəli sayılır —
 * əks halda yenidən giriş edənə qədər bütün sidebar səbəbsiz yerə boşalardı.
 */
export function useHasPermission(): (resource: string, action: string) => boolean {
  const permissions = useAuthStore((s) => s.user?.permissions);
  return (resource, action) => {
    if (!permissions) return true;
    return (permissions[resource] ?? []).includes(action);
  };
}
