import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import {
  IconBuilding,
  IconDashboard,
  IconLogout,
  IconReceipt,
  IconSettings,
  IconShield,
  IconUser,
  IconUsers,
} from "./icons";
import { Wordmark } from "./Logo";
import type { ComponentType, SVGProps } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const navItems: NavItem[] = [
  { to: "/", label: "Ümumi baxış", icon: IconDashboard },
  { to: "/tenants", label: "Bizneslər", icon: IconBuilding },
  { to: "/leads", label: "Pilot sorğuları", icon: IconUsers },
  { to: "/usage", label: "Hesablaşma", icon: IconReceipt },
  { to: "/roles", label: "Rollar", icon: IconShield },
  { to: "/users", label: "İstifadəçilər", icon: IconUser },
  { to: "/settings", label: "Ayarlar", icon: IconSettings },
];

export function Layout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
        <div className="flex flex-col gap-1 border-b border-border px-5 pb-4 pt-6">
          <Wordmark size="1.6rem" />
          <p className="text-[11px] text-fg-faint">Admin Panel</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-surface-2 font-medium text-fg"
                    : "text-fg-muted hover:bg-surface-2/60 hover:text-fg"
                }`
              }
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <div className="mb-2 px-3">
            <p className="truncate text-sm font-medium text-fg">
              {user?.email ?? "—"}
            </p>
            <p className="truncate text-xs text-fg-faint">{user?.roleName ?? "Admin"}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-fg-muted transition-colors hover:bg-surface-2/60 hover:text-fg"
          >
            <IconLogout />
            Çıxış
          </button>
        </div>
      </aside>

      {/* Content */}
      {/* Tam en. Evvel mx-auto max-w-6xl idi: ekranin sagi bos qalirdi, cedveller ise
          9 sutunla sixisib ufuqi surusurdu. Bu panel sened deyil, is ekranidir —
          eni oxunaqliliq ucun daraltmaq burada eks netice verir. */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
