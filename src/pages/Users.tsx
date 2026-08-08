import { UsersTab } from "../components/UsersTab";
import { PageHeader } from "../components/ui";

/**
 * Admin panelin öz istifadəçiləri — platforma işçiləri, heç bir müəssisəyə bağlı deyil.
 *
 * Bir müəssisənin öz panel istifadəçiləri eyni komponentlə, onun daxili səhifəsindən idarə
 * olunur — fərq yalnız əhatədədir (bax UsersTab, RolesPage-dəki eyni naxış).
 */
export function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="İstifadəçilər"
        subtitle="Admin panelə kimin girişi var və hansı rolla. Rolların özü Rollar bölməsində qurulur."
      />
      <UsersTab />
    </div>
  );
}
