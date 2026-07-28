import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import {
  copyTemplateToTenant,
  createRole,
  deleteRole,
  getCatalog,
  listRoles,
  updateRole,
  type PermissionCatalog,
  type RoleDetail,
} from "../api/roles";
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
  type Department,
} from "../api/departments";
import { listTenants } from "../api/tenants";
import type { Tenant } from "../api/types";
import { PermissionMatrix } from "../components/PermissionMatrix";
import { IconPlus, IconTrash } from "../components/icons";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  inputCls,
  Modal,
  PageHeader,
  Select,
  Spinner,
  StatusText,
} from "../components/ui";

function errorText(e: unknown, fallback: string): string {
  const err = e as AxiosError<{ detail?: string }>;
  return err.response?.data?.detail ?? fallback;
}

const UNGROUPED = "Departamentsiz";

/**
 * Rolları departamentlərinə görə qruplaşdırır.
 *
 * Departamenti olmayanlar həmişə sonuncu gəlir: onlar "hələ yerbəyer edilməyib" deməkdir,
 * yəni siyahının ortasında itməli deyil.
 */
function groupByDepartment(
  roles: RoleDetail[],
  departments: Department[],
): { name: string; roles: RoleDetail[] }[] {
  const groups: { name: string; roles: RoleDetail[] }[] = [];

  for (const d of departments) {
    const inside = roles.filter((r) => r.departmentId === d.id);
    if (inside.length > 0) groups.push({ name: d.name, roles: inside });
  }

  const loose = roles.filter(
    (r) => !r.departmentId || !departments.some((d) => d.id === r.departmentId),
  );
  if (loose.length > 0) groups.push({ name: UNGROUPED, roles: loose });

  return groups;
}

export function RolesPage() {
  const [catalog, setCatalog] = useState<PermissionCatalog | null>(null);
  const [roles, setRoles] = useState<RoleDetail[] | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selected, setSelected] = useState<RoleDetail | null>(null);
  const [draft, setDraft] = useState<Record<string, string[]>>({});
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [departmentsOpen, setDepartmentsOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);

  const reload = async (keepId?: string) => {
    const [list, deps] = await Promise.all([listRoles(), listDepartments()]);
    setRoles(list);
    setDepartments(deps);
    pick(list.find((r) => r.id === keepId) ?? list[0] ?? null);
  };

  const pick = (role: RoleDetail | null) => {
    setSelected(role);
    setDraft(role ? { ...role.permissions } : {});
    setName(role?.name ?? "");
    setDescription(role?.description ?? "");
    setDepartmentId(role?.departmentId ?? "");
    setDone(false);
    setError(null);
  };

  useEffect(() => {
    Promise.all([getCatalog(), listRoles(), listDepartments()])
      .then(([c, list, deps]) => {
        setCatalog(c);
        setRoles(list);
        setDepartments(deps);
        pick(list[0] ?? null);
      })
      .catch(() => setError("Rollar yüklənmədi."));
  }, []);

  const groups = useMemo(
    () => groupByDepartment(roles ?? [], departments),
    [roles, departments],
  );

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    setDone(false);
    try {
      await updateRole(selected.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        tenantId: selected.tenantId,
        departmentId: departmentId || null,
        template: selected.template,
        permissions: draft,
      });
      await reload(selected.id);
      setDone(true);
    } catch (e) {
      setError(errorText(e, "Yadda saxlanmadı."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!selected) return;
    if (!confirm(`"${selected.name}" rolu silinsin?`)) return;
    setError(null);
    try {
      await deleteRole(selected.id);
      await reload();
    } catch (e) {
      setError(errorText(e, "Silinmədi."));
    }
  };

  if (!catalog || !roles) {
    return error ? <Alert tone="err">{error}</Alert> : <Spinner />;
  }

  const grantCount = Object.values(draft).reduce((n, a) => n + a.length, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rollar"
        subtitle="Hər rolun nə edə biləcəyi. Xana boşdursa — icazə yoxdur."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setDepartmentsOpen(true)}>
              Departamentlər
            </Button>
            <Button icon={IconPlus} onClick={() => setCreateOpen(true)}>
              Yeni rol
            </Button>
          </div>
        }
      />

      {error && <Alert tone="err">{error}</Alert>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[18rem_1fr]">
        <Card className="h-fit">
          <CardHeader title="Platforma rolları" />
          <CardBody className="p-0">
            {groups.map((group) => (
              <div key={group.name}>
                <div className="border-b border-border/60 bg-surface-2/40 px-5 py-2 text-xs font-medium uppercase tracking-wide text-fg-faint">
                  {group.name}
                </div>
                <ul>
                  {group.roles.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => pick(r)}
                        className={`flex w-full flex-col items-start gap-0.5 border-b border-border/60 px-5 py-3 text-left transition-colors ${
                          selected?.id === r.id ? "bg-surface-2" : "hover:bg-surface-2/60"
                        }`}
                      >
                        <span className="flex w-full items-baseline justify-between gap-2">
                          <span className="text-sm font-medium text-fg">{r.name}</span>
                          {r.template && <StatusText tone="neutral">şablon</StatusText>}
                        </span>
                        <span className="text-xs text-fg-faint">
                          {r.userCount} istifadəçi
                          {r.system && " · sistem"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardBody>
        </Card>

        {selected ? (
          <Card>
            <CardHeader
              title={selected.name}
              description={`${grantCount} icazə verilib`}
              actions={
                <div className="flex gap-2">
                  {selected.template && (
                    <Button variant="secondary" size="sm" onClick={() => setCopyOpen(true)}>
                      Müəssisəyə köçür
                    </Button>
                  )}
                  {!selected.system && (
                    <Button variant="danger" size="sm" icon={IconTrash} onClick={remove}>
                      Sil
                    </Button>
                  )}
                  <Button size="sm" loading={saving} onClick={save}>
                    Yadda saxla
                  </Button>
                </div>
              }
            />
            <CardBody className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Ad">
                  <input
                    className={inputCls}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field>
                <Field label="Təsvir">
                  <input
                    className={inputCls}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Field>
                <Select
                  label="Departament"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  options={[
                    { value: "", label: "— seçilməyib —" },
                    ...departments.map((d) => ({ value: d.id, label: d.name })),
                  ]}
                />
              </div>

              {selected.system && (
                <Alert tone="info">
                  Sistem rolu: adını və icazələrini dəyişə bilərsən, amma silmək olmaz —
                  platforma onun mövcudluğuna güvənir.
                </Alert>
              )}

              <PermissionMatrix
                catalog={catalog}
                value={draft}
                onChange={setDraft}
                scope={selected.tenantId === null ? "platform" : "tenant"}
              />

              {done && (
                <p className="text-sm text-fg-muted">
                  Yadda saxlanıldı. Dəyişiklik növbəti sorğudan qüvvəyə minir.
                </p>
              )}
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody>
              <p className="text-sm text-fg-faint">Rol seçilməyib.</p>
            </CardBody>
          </Card>
        )}
      </div>

      {createOpen && (
        <CreateRoleModal
          catalog={catalog}
          departments={departments}
          onClose={() => setCreateOpen(false)}
          onCreated={(r) => reload(r.id)}
        />
      )}

      {departmentsOpen && (
        <DepartmentsModal
          departments={departments}
          onClose={() => setDepartmentsOpen(false)}
          onChanged={() => reload(selected?.id)}
        />
      )}

      {copyOpen && selected && (
        <CopyTemplateModal
          template={selected}
          onClose={() => setCopyOpen(false)}
        />
      )}
    </div>
  );
}

function CreateRoleModal({
  catalog,
  departments,
  onClose,
  onCreated,
}: {
  catalog: PermissionCatalog;
  departments: Department[];
  onClose: () => void;
  onCreated: (r: RoleDetail) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [template, setTemplate] = useState(true);
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const created = await createRole({
        name: name.trim(),
        description: description.trim() || undefined,
        tenantId: null,
        departmentId: departmentId || null,
        template,
        permissions,
      });
      onCreated(created);
      onClose();
    } catch (e) {
      setError(errorText(e, "Rol yaradıla bilmədi."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Yeni rol" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Ad">
          <input
            className={inputCls}
            placeholder="Dəstək əməkdaşı"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Təsvir">
          <input
            className={inputCls}
            placeholder="Nə edə bilir"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <Select
          label="Departament"
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          options={[
            { value: "", label: "— seçilməyib —" },
            ...departments.map((d) => ({ value: d.id, label: d.name })),
          ]}
        />

        <label className="flex items-center gap-2 text-sm text-fg">
          <input
            type="checkbox"
            checked={template}
            onChange={(e) => setTemplate(e.target.checked)}
            className="h-4 w-4 accent-accent"
          />
          Şablon — müəssisələr bu rolu öz işçilərinə verə bilsin
        </label>

        <PermissionMatrix
          catalog={catalog}
          value={permissions}
          onChange={setPermissions}
          scope="platform"
        />

        {error && <p className="text-sm text-err">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Ləğv et
          </Button>
          <Button loading={saving} disabled={!name.trim()} onClick={submit}>
            Yarat
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Departamentlərin idarəsi.
 *
 * Silmə xəbərdarlığı təsadüfi deyil: departament silinəndə içindəki rollar silinmir, sadəcə
 * qruplaşmadan çıxır. Bunu yazmasaq, operator rolları da itirdiyini düşünüb silməkdən çəkinər.
 */
function DepartmentsModal({
  departments,
  onClose,
  onChanged,
}: {
  departments: Department[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [rows, setRows] = useState(departments);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setRows(await listDepartments());
    onChanged();
  };

  const add = async () => {
    setBusy(true);
    setError(null);
    try {
      await createDepartment({
        name: name.trim(),
        description: description.trim() || undefined,
        tenantId: null,
      });
      setName("");
      setDescription("");
      await refresh();
    } catch (e) {
      setError(errorText(e, "Departament yaradıla bilmədi."));
    } finally {
      setBusy(false);
    }
  };

  const rename = async (d: Department, next: string) => {
    if (!next.trim() || next.trim() === d.name) return;
    setError(null);
    try {
      await updateDepartment(d.id, { name: next.trim(), description: d.description ?? undefined });
      await refresh();
    } catch (e) {
      setError(errorText(e, "Ad dəyişdirilmədi."));
    }
  };

  const remove = async (d: Department) => {
    const warning =
      d.roleCount > 0
        ? `"${d.name}" silinsin? İçindəki ${d.roleCount} rol silinmir — sadəcə departamentsiz qalır.`
        : `"${d.name}" silinsin?`;
    if (!confirm(warning)) return;
    setError(null);
    try {
      await deleteDepartment(d.id);
      await refresh();
    } catch (e) {
      setError(errorText(e, "Silinmədi."));
    }
  };

  return (
    <Modal title="Departamentlər" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-fg-muted">
          Departament rolları qruplaşdırır. Rolun icazələrinə təsir etmir.
        </p>

        {rows.length > 0 && (
          <ul className="divide-y divide-border/60 rounded-md border border-border">
            {rows.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-4 py-3">
                <input
                  defaultValue={d.name}
                  className={`${inputCls} flex-1`}
                  onBlur={(e) => rename(d, e.target.value)}
                  aria-label="Departament adı"
                />
                <span className="w-20 shrink-0 text-right text-xs text-fg-faint">
                  {d.roleCount} rol
                </span>
                <Button
                  variant="danger"
                  size="sm"
                  icon={IconTrash}
                  iconOnly
                  aria-label="Sil"
                  onClick={() => remove(d)}
                />
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-3 rounded-md border border-border p-4">
          <Field label="Yeni departament">
            <input
              className={inputCls}
              placeholder="Dəstək"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Təsvir">
            <input
              className={inputCls}
              placeholder="Müştəri sorğuları"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <div className="flex justify-end">
            <Button size="sm" loading={busy} disabled={!name.trim()} onClick={add}>
              Əlavə et
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-err">{error}</p>}

        <div className="flex justify-end">
          <Button onClick={onClose}>Bağla</Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Şablonu bir müəssisəyə köçürür.
 *
 * Köçürmə surətdir, keçid deyil: müəssisə sonradan öz nüsxəsini dəyişəndə şablon və digər
 * müəssisələr toxunulmaz qalır.
 */
function CopyTemplateModal({
  template,
  onClose,
}: {
  template: RoleDetail;
  onClose: () => void;
}) {
  const [tenants, setTenants] = useState<Tenant[] | null>(null);
  const [tenantId, setTenantId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    listTenants({ size: 200, sort: "name", direction: "asc" })
      .then((page) => {
        setTenants(page.content);
        setTenantId(page.content[0]?.id ?? "");
      })
      .catch(() => setError("Müəssisələr yüklənmədi."));
  }, []);

  const copy = async () => {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const created = await copyTemplateToTenant(template.id, tenantId);
      const target = tenants?.find((t) => t.id === tenantId)?.name ?? "müəssisə";
      setDone(`"${created.name}" rolu ${target} müəssisəsinə əlavə olundu.`);
    } catch (e) {
      setError(errorText(e, "Köçürülmədi."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Şablonu müəssisəyə köçür" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-fg-muted">
          <span className="text-fg">{template.name}</span> şablonunun surəti seçilmiş
          müəssisəyə əlavə olunur. Müəssisə öz nüsxəsini sonradan dəyişə bilər — şablona
          təsir etmir.
        </p>

        {!tenants ? (
          <Spinner />
        ) : (
          <Select
            label="Müəssisə"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            options={tenants.map((t) => ({ value: t.id, label: t.name }))}
          />
        )}

        {error && <p className="text-sm text-err">{error}</p>}
        {done && <p className="text-sm text-fg-muted">{done}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Bağla
          </Button>
          <Button loading={busy} disabled={!tenantId} onClick={copy}>
            Köçür
          </Button>
        </div>
      </div>
    </Modal>
  );
}
