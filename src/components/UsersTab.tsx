import { useEffect, useState, type FormEvent } from "react";
import { AxiosError } from "axios";
import {
  changeUserRole,
  createUser,
  deleteUser,
  listAssignableRoles,
  listUsers,
  resetPassword,
  setUserStatus,
  updateUser,
  type AssignableRole,
  type PanelUser,
  type PanelUserCreated,
} from "../api/users";
import { IconCopy, IconEdit, IconPlus, IconRefresh, IconTrash } from "./icons";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  inputCls,
  Modal,
  Select,
  Spinner,
  StatusText,
  Table,
  TableContainer,
  TableEmpty,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "./ui";
import { formatDateTime } from "../lib/format";

function errorText(e: unknown, fallback: string): string {
  const err = e as AxiosError<{ detail?: string }>;
  return err.response?.data?.detail ?? fallback;
}

/**
 * Şifrə pəncərəsi — iki fərqli nəticə üçün.
 *
 * SMTP quruludursa şifrə serverdən ÜMUMİYYƏTLƏ qaytarılmır (`password: null`), çünki onu
 * e-poçtla göndərdikdən sonra bir də ekrana çıxarmağın mənası yoxdur. O halda burada
 * göstəriləsi şifrə yoxdur və pəncərə bunu deməlidir — boş bir sahə göstərmək yox.
 *
 * SMTP yoxdursa şifrə buradadır və yalnız bu bir dəfə: bazada hash saxlanılır, geri qaytarmaq
 * mümkün deyil. Ekran bunu açıq deməlidir, yoxsa operator kopyalamadan bağlayır.
 */
function PasswordDialog({
  result,
  onClose,
}: {
  result: PanelUserCreated;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(
      `Voint panel\nE-poçt: ${result.user.email}\nŞifrə: ${result.password}`,
    );
    setCopied(true);
  };

  if (result.emailed) {
    return (
      <Modal title="Şifrə göndərildi" onClose={onClose}>
        <div className="space-y-4">
          <p className="text-sm text-fg-muted">
            Yeni şifrə <span className="text-fg">{result.user.email}</span> ünvanına
            göndərildi. Təhlükəsizlik üçün burada göstərilmir.
          </p>
          <p className="text-sm text-fg-muted">
            Gəlməyibsə spam qovluğuna baxsınlar. Ünvan səhvdirsə — əvvəlcə{" "}
            <span className="text-fg">Redaktə</span> ilə düzəlt, sonra şifrəni yenidən
            sıfırla; mesaj yeni ünvana gedəcək.
          </p>
          <div className="flex justify-end">
            <Button onClick={onClose}>Bağla</Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Şifrə" onClose={onClose}>
      <div className="space-y-4">
        <Alert tone="warn" title="Bu şifrə bir daha göstərilməyəcək">
          Bazada yalnız şifrələnmiş forması saxlanılır. Pəncərəni bağlamazdan əvvəl
          kopyala — itirsən, yenidən sıfırlamaq lazım gələcək.
        </Alert>

        <div className="rounded-md border border-border bg-surface-2 p-4 font-mono text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-fg-muted">E-poçt</span>
            <span className="text-fg">{result.user.email}</span>
          </div>
          <div className="mt-2 flex justify-between gap-4">
            <span className="text-fg-muted">Şifrə</span>
            <span className="select-all text-fg">{result.password}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" icon={IconCopy} onClick={copy}>
            {copied ? "Kopyalandı" : "Kopyala"}
          </Button>
          <Button onClick={onClose}>Bağla</Button>
        </div>
      </div>
    </Modal>
  );
}

function CreateUserModal({
  tenantId,
  roles,
  onClose,
  onCreated,
}: {
  tenantId: string;
  roles: AssignableRole[];
  onClose: () => void;
  onCreated: (r: PanelUserCreated) => void;
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [roleId, setRoleId] = useState(roles[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const result = await createUser(tenantId, {
        email: email.trim(),
        fullName: fullName.trim() || undefined,
        roleId,
      });
      onCreated(result);
      onClose();
    } catch (e) {
      setError(errorText(e, "İstifadəçi yaradıla bilmədi."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Yeni istifadəçi" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="E-poçt">
          <input
            required
            type="email"
            autoComplete="off"
            className={inputCls}
            placeholder="admin@klinika.az"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label="Ad Soyad">
          <input
            className={inputCls}
            placeholder="Aygün Məmmədova"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </Field>

        <Select
          label="Rol"
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          options={roles.map((r) => ({ value: r.id, label: r.name }))}
          help={roles.find((r) => r.id === roleId)?.description}
        />

        {error && <p className="text-sm text-err">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>
            Ləğv et
          </Button>
          <Button type="submit" loading={saving} disabled={!roleId}>
            Yarat
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * İstifadəçi məlumatlarının redaktəsi.
 *
 * Yalnız ad və e-poçt: rol, vəziyyət və şifrə ayrı düymələrdədir, çünki hər birinin başqa
 * nəticəsi var. E-poçt dəyişəndə xəbərdarlıq göstərilir — o, sadəcə bir sahə deyil, giriş adının
 * özüdür, və dəyişdikdə istifadəçinin açıq sessiyası dayanır.
 */
function EditUserModal({
  tenantId,
  user,
  onClose,
  onSaved,
}: {
  tenantId: string;
  user: PanelUser;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [email, setEmail] = useState(user.email);
  const [fullName, setFullName] = useState(user.fullName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailChanged = email.trim().toLowerCase() !== user.email.toLowerCase();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateUser(tenantId, user.id, {
        email: email.trim(),
        fullName: fullName.trim() || undefined,
      });
      onSaved();
      onClose();
    } catch (e) {
      setError(errorText(e, "Yadda saxlanmadı."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="İstifadəçini redaktə et" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="E-poçt">
          <input
            required
            type="email"
            autoComplete="off"
            className={inputCls}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label="Ad Soyad">
          <input
            className={inputCls}
            placeholder="Aygün Məmmədova"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </Field>

        {emailChanged && (
          <Alert tone="warn" title="Giriş ünvanı dəyişir">
            İstifadəçi bundan sonra <span className="text-fg">{email.trim()}</span> ilə girəcək.
            Açıq sessiyası dayanacaq. Şifrə dəyişmir.
          </Alert>
        )}

        {error && <p className="text-sm text-err">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>
            Ləğv et
          </Button>
          <Button type="submit" loading={saving} disabled={!email.trim()}>
            Yadda saxla
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function UsersTab({ tenantId }: { tenantId: string }) {
  const [users, setUsers] = useState<PanelUser[] | null>(null);
  const [roles, setRoles] = useState<AssignableRole[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [passwordResult, setPasswordResult] = useState<PanelUserCreated | null>(null);
  const [editing, setEditing] = useState<PanelUser | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = () =>
    listUsers(tenantId)
      .then(setUsers)
      .catch(() => setError("İstifadəçilər yüklənmədi."));

  useEffect(() => {
    reload();
    listAssignableRoles(tenantId).then(setRoles).catch(() => setRoles([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const act = async (id: string, fn: () => Promise<unknown>, fallback: string) => {
    setBusyId(id);
    setError(null);
    try {
      await fn();
      await reload();
    } catch (e) {
      setError(errorText(e, fallback));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Panel istifadəçiləri"
        description="Bu müəssisənin öz panelinə giriş hesabları."
        actions={
          <Button
            size="sm"
            icon={IconPlus}
            onClick={() => setCreateOpen(true)}
            disabled={roles.length === 0}
          >
            Yeni istifadəçi
          </Button>
        }
      />
      <CardBody className="p-0">
        {error && (
          <div className="px-5 pt-4">
            <Alert tone="err">{error}</Alert>
          </div>
        )}

        {!users ? (
          <div className="p-5">
            <Spinner />
          </div>
        ) : (
          <TableContainer>
            <Table>
              <THead>
                <TH>E-poçt</TH>
                <TH>Ad</TH>
                <TH>Rol</TH>
                <TH>Vəziyyət</TH>
                <TH>Son giriş</TH>
                <TH className="text-right">Əməliyyat</TH>
              </THead>
              <TBody>
                {users.length === 0 ? (
                  <TableEmpty
                    colSpan={6}
                    message="Hələ istifadəçi yoxdur. Müəssisə panelə girə bilməz."
                  />
                ) : (
                  users.map((u) => (
                    <TR key={u.id}>
                      <TD className="font-medium text-fg">{u.email}</TD>
                      <TD className="text-fg-muted">{u.fullName ?? "—"}</TD>
                      <TD>
                        {roles.length > 0 ? (
                          <Select
                            aria-label="Rol"
                            value={u.roleId ?? ""}
                            onChange={(e) =>
                              act(
                                u.id,
                                () => changeUserRole(tenantId, u.id, e.target.value),
                                "Rol dəyişdirilmədi.",
                              )
                            }
                            options={roles.map((r) => ({ value: r.id, label: r.name }))}
                            containerClassName="w-40"
                          />
                        ) : (
                          <span className="text-fg-muted">{u.roleName ?? "—"}</span>
                        )}
                      </TD>
                      <TD>
                        <StatusText tone={u.status === "ACTIVE" ? "ok" : "err"}>
                          {u.status === "ACTIVE" ? "aktiv" : "bloklanıb"}
                        </StatusText>
                      </TD>
                      <TD className="text-fg-muted">
                        {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "heç vaxt"}
                      </TD>
                      <TD className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={IconEdit}
                            onClick={() => setEditing(u)}
                          >
                            Redaktə
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={IconRefresh}
                            loading={busyId === u.id}
                            onClick={() =>
                              act(
                                u.id,
                                async () =>
                                  setPasswordResult(await resetPassword(tenantId, u.id)),
                                "Şifrə sıfırlanmadı.",
                              )
                            }
                          >
                            Şifrə
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              act(
                                u.id,
                                () =>
                                  setUserStatus(
                                    tenantId,
                                    u.id,
                                    u.status === "ACTIVE" ? "BLOCKED" : "ACTIVE",
                                  ),
                                "Vəziyyət dəyişdirilmədi.",
                              )
                            }
                          >
                            {u.status === "ACTIVE" ? "Blokla" : "Aç"}
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            icon={IconTrash}
                            iconOnly
                            aria-label="Sil"
                            onClick={() => {
                              if (
                                confirm(`${u.email} silinsin? Bu geri qaytarıla bilməz.`)
                              ) {
                                act(u.id, () => deleteUser(tenantId, u.id), "Silinmədi.");
                              }
                            }}
                          />
                        </div>
                      </TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
          </TableContainer>
        )}
      </CardBody>

      {createOpen && (
        <CreateUserModal
          tenantId={tenantId}
          roles={roles}
          onClose={() => setCreateOpen(false)}
          onCreated={(r) => {
            setPasswordResult(r);
            reload();
          }}
        />
      )}

      {editing && (
        <EditUserModal
          tenantId={tenantId}
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={reload}
        />
      )}

      {passwordResult && (
        <PasswordDialog
          result={passwordResult}
          onClose={() => setPasswordResult(null)}
        />
      )}
    </Card>
  );
}
