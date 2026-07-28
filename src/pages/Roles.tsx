import { RolesManager } from "../components/RolesManager";
import { PageHeader } from "../components/ui";

/**
 * Platforma səviyyəsindəki rollar və şablonlar.
 *
 * Bir müəssisənin öz rolları eyni komponentlə, onun daxili səhifəsindən idarə olunur —
 * fərq yalnız əhatədədir (bax RolesManager).
 */
export function RolesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Rollar"
        subtitle="Hər rolun nə edə biləcəyi. Xana boşdursa — icazə yoxdur."
      />
      <RolesManager />
    </div>
  );
}
