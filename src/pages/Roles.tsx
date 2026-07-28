import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import {
  createRole,
  deleteRole,
  getCatalog,
  listRoles,
  updateRole,
  type PermissionCatalog,
  type RoleDetail,
} from "../api/roles";
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
  Spinner,
  StatusText,
} from "../components/ui";

function errorText(e: unknown, fallback: string): string {
  const err = e as AxiosError<{ detail?: string }>;
  return err.response?.data?.detail ?? fallback;
}

export function RolesPage() {
  const [catalog, setCatalog] = useState<PermissionCatalog | null>(null);
  const [roles, setRoles] = useState<RoleDetail[] | null>(null);
  const [selected, setSelected] = useState<RoleDetail | null>(null);
  const [draft, setDraft] = useState<Record<string, string[]>>({});
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const reload = async (keepId?: string) => {
    const list = await listRoles();
    setRoles(list);
    const next = list.find((r) => r.id === keepId) ?? list[0] ?? null;
    pick(next);
  };

  const pick = (role: RoleDetail | null) => {
    setSelected(role);
    setDraft(role ? { ...role.permissions } : {});
    setName(role?.name ?? "");
    setDescription(role?.description ?? "");
    setDone(false);
    setError(null);
  };

  useEffect(() => {
    Promise.all([getCatalog(), listRoles()])
      .then(([c, list]) => {
        setCatalog(c);
        setRoles(list);
        pick(list[0] ?? null);
      })
      .catch(() => setError("Rollar yüklənmədi."));
  }, []);

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
          <Button icon={IconPlus} onClick={() => setCreateOpen(true)}>
            Yeni rol
          </Button>
        }
      />

      {error && <Alert tone="err">{error}</Alert>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[18rem_1fr]">
        <Card className="h-fit">
          <CardHeader title="Platforma rolları" />
          <CardBody className="p-0">
            <ul>
              {roles.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => pick(r)}
                    className={`flex w-full flex-col items-start gap-0.5 border-b border-border/60 px-5 py-3 text-left transition-colors last:border-0 ${
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
          </CardBody>
        </Card>

        {selected ? (
          <Card>
            <CardHeader
              title={selected.name}
              description={`${grantCount} icazə verilib`}
              actions={
                <div className="flex gap-2">
                  {!selected.system && (
                    <Button
                      variant="danger"
                      size="sm"
                      icon={IconTrash}
                      onClick={remove}
                    >
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          onClose={() => setCreateOpen(false)}
          onCreated={(r) => reload(r.id)}
        />
      )}
    </div>
  );
}

function CreateRoleModal({
  catalog,
  onClose,
  onCreated,
}: {
  catalog: PermissionCatalog;
  onClose: () => void;
  onCreated: (r: RoleDetail) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
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
