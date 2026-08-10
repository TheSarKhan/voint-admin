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
import { clientPage, DataTable, type Column } from "./DataTable";
import {
  IconCheck,
  IconCopy,
  IconEdit,
  IconLock,
  IconMore,
  IconPlus,
  IconRefresh,
  IconTrash,
} from "./icons";
import {
  Alert,
  Button,
  DropdownMenu,
  Field,
  InlineSpinner,
  inputCls,
  Modal,
  Select,
  Spinner,
  StatusText,
  type DropdownItem,
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
  tenantId?: string;
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
  tenantId?: string;
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

/**
 * Rol seçimləri.
 *
 * İstifadəçinin hazırkı rolu siyahıda yoxdursa, siyahı ONA UYĞUNLAŞDIRILIR — əks halda <select>
 * boş və ya başqa bir rolla göstərilir, yəni ekran istifadəçini olmadığı bir rolda göstərir və
 * bir təsadüfi klik onu həqiqətən dəyişir. Belə hal olmamalıdır, amma olsa görünsün.
 */
function roleOptions(user: PanelUser, roles: AssignableRole[]) {
  const options = roles.map((r) => ({ value: r.id, label: r.name }));
  if (user.roleId && !roles.some((r) => r.id === user.roleId)) {
    options.unshift({
      value: user.roleId,
      label: `${user.roleName ?? "Naməlum rol"} (siyahıda yoxdur)`,
    });
  }
  return options;
}

/** DataTable-ın axtarış qutusu üçün: hansı sahələr üzrə axtarılsın. */
function matchesUser(u: PanelUser, needle: string): boolean {
  return (
    u.email.toLowerCase().includes(needle) ||
    (u.fullName ?? "").toLowerCase().includes(needle) ||
    (u.roleName ?? "").toLowerCase().includes(needle)
  );
}

/** DataTable-ın sütun başlıqlarına klikləyəndə sıralama - Column.key ilə uyğun adlar. */
function compareUser(key: string): (a: PanelUser, b: PanelUser) => number {
  return (a, b) => {
    switch (key) {
      case "email":
        return a.email.localeCompare(b.email);
      case "fullName":
        return (a.fullName ?? "").localeCompare(b.fullName ?? "");
      case "status":
        return a.status.localeCompare(b.status);
      case "lastLoginAt":
        return (a.lastLoginAt ?? "").localeCompare(b.lastLoginAt ?? "");
      default:
        return 0;
    }
  };
}

/** tenantId verilməzsə platforma (admin panelin öz) istifadəçiləri idarə olunur. */
export function UsersTab({ tenantId }: { tenantId?: string }) {
  const platform = !tenantId;
  const [users, setUsers] = useState<PanelUser[] | null>(null);
  const [roles, setRoles] = useState<AssignableRole[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [passwordResult, setPasswordResult] = useState<PanelUserCreated | null>(null);
  const [editing, setEditing] = useState<PanelUser | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  // DataTable öz sorğusunu yalnız "state" (axtarış/sıralama/səhifə) və ya "resetKey" dəyişəndə
  // təkrarlayır - "fetchPage" hər render-də yeni funksiya olsa belə. Bir əməliyyatdan sonra
  // cədvəli təzələmək üçün bunu artırırıq (bax act()).
  const [refreshTick, setRefreshTick] = useState(0);

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
      setRefreshTick((t) => t + 1);
    } catch (e) {
      setError(errorText(e, fallback));
    } finally {
      setBusyId(null);
    }
  };

  /** Sətirdəki dördlük düymə cərgəsi əvəzinə "..." menyusunun içindəki siyahı. */
  const actionsFor = (u: PanelUser): DropdownItem[] => [
    {
      label: "Redaktə",
      icon: IconEdit,
      onSelect: () => setEditing(u),
    },
    {
      label: "Şifrəni sıfırla",
      icon: IconRefresh,
      onSelect: () =>
        act(
          u.id,
          async () => setPasswordResult(await resetPassword(tenantId, u.id)),
          "Şifrə sıfırlanmadı.",
        ),
    },
    {
      label: u.status === "ACTIVE" ? "Blokla" : "Aç",
      icon: u.status === "ACTIVE" ? IconLock : IconCheck,
      onSelect: () =>
        act(
          u.id,
          () => setUserStatus(tenantId, u.id, u.status === "ACTIVE" ? "BLOCKED" : "ACTIVE"),
          "Vəziyyət dəyişdirilmədi.",
        ),
    },
    {
      label: "Sil",
      icon: IconTrash,
      danger: true,
      onSelect: () => {
        if (confirm(`${u.email} silinsin? Bu geri qaytarıla bilməz.`)) {
          act(u.id, () => deleteUser(tenantId, u.id), "Silinmədi.");
        }
      },
    },
  ];

  const columns: Column<PanelUser>[] = [
    {
      key: "email",
      header: "E-poçt",
      cell: (u) => <span className="font-medium text-fg">{u.email}</span>,
    },
    {
      key: "fullName",
      header: "Ad",
      cell: (u) => <span className="text-fg-muted">{u.fullName ?? "—"}</span>,
    },
    {
      header: "Rol",
      cell: (u) =>
        roles.length > 0 ? (
          <Select
            aria-label="Rol"
            value={u.roleId ?? ""}
            onChange={(e) =>
              act(u.id, () => changeUserRole(tenantId, u.id, e.target.value), "Rol dəyişdirilmədi.")
            }
            options={roleOptions(u, roles)}
            containerClassName="w-40"
          />
        ) : (
          <span className="text-fg-muted">{u.roleName ?? "—"}</span>
        ),
    },
    {
      key: "status",
      header: "Vəziyyət",
      cell: (u) => (
        <StatusText tone={u.status === "ACTIVE" ? "ok" : "err"}>
          {u.status === "ACTIVE" ? "aktiv" : "bloklanıb"}
        </StatusText>
      ),
    },
    {
      key: "lastLoginAt",
      header: "Son giriş",
      cell: (u) => (
        <span className="text-fg-muted">
          {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "heç vaxt"}
        </span>
      ),
    },
    {
      header: "Əməliyyat",
      align: "right",
      cell: (u) => (
        <div className="flex justify-end">
          <DropdownMenu
            trigger={
              busyId === u.id ? (
                <span className="flex h-8 w-8 items-center justify-center">
                  <InlineSpinner />
                </span>
              ) : (
                <span
                  aria-label="Əməliyyatlar"
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
                >
                  <IconMore width={16} height={16} />
                </span>
              )
            }
            items={actionsFor(u)}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-fg">
            {platform ? "Admin panel istifadəçiləri" : "Panel istifadəçiləri"}
          </h2>
          <p className="mt-1 text-xs text-fg-muted">
            {platform
              ? "Platformanın öz admin panelinə giriş hesabları."
              : "Bu müəssisənin öz panelinə giriş hesabları."}
          </p>
        </div>
        <Button
          size="sm"
          icon={IconPlus}
          onClick={() => setCreateOpen(true)}
          disabled={roles.length === 0}
        >
          Yeni istifadəçi
        </Button>
      </div>

      {error ? (
        <Alert tone="err">{error}</Alert>
      ) : !users ? (
        <Spinner />
      ) : (
        <DataTable
          columns={columns}
          rowKey={(u) => u.id}
          defaultSort="email"
          searchPlaceholder="E-poçt, ad və ya rol üzrə axtar…"
          emptyMessage={
            platform
              ? "Hələ istifadəçi yoxdur. Heç kim admin panelə girə bilməz."
              : "Hələ istifadəçi yoxdur. Müəssisə panelə girə bilməz."
          }
          resetKey={refreshTick}
          fetchPage={clientPage(users, matchesUser, compareUser)}
          onRowClick={(u) => setEditing(u)}
        />
      )}

      {createOpen && (
        <CreateUserModal
          tenantId={tenantId}
          roles={roles}
          onClose={() => setCreateOpen(false)}
          onCreated={async (r) => {
            setPasswordResult(r);
            // reload() bitmeden tick-i artirsaq, DataTable KOHNE `users` bagli fetchPage
            // qurur ve bir de tetiklenmir (bax DataTable-in resetKey qeydi) - yeni setir
            // yalniz elle sehife yenilenende gorunur.
            await reload();
            setRefreshTick((t) => t + 1);
          }}
        />
      )}

      {editing && (
        <EditUserModal
          tenantId={tenantId}
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            await reload();
            setRefreshTick((t) => t + 1);
          }}
        />
      )}

      {passwordResult && (
        <PasswordDialog result={passwordResult} onClose={() => setPasswordResult(null)} />
      )}
    </div>
  );
}
