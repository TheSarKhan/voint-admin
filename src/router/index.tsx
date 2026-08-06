import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { Layout } from "../components/Layout";
import { LoginPage } from "../pages/Login";
import { ForgotPasswordPage } from "../pages/ForgotPassword";
import { ResetPasswordPage } from "../pages/ResetPassword";
import { TenantsPage } from "../pages/Tenants";
import { TenantDetailPage } from "../pages/TenantDetail";
import { LeadsPage } from "../pages/Leads";
import { UsagePage } from "../pages/Usage";
import { CallDetailPage } from "../pages/CallDetail";
import { InvoicePage } from "../pages/Invoice";
import { SettingsPage } from "../pages/Settings";
import { RolesPage } from "../pages/Roles";

function ProtectedRoute() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  // Login artiq rolu yoxlayir, amma bu, kohne saxlanmis sessiyalar ucundur: brauzerde
  // qalmis muessise tokeni ile panel acilir ve HER sorgu 403 verir. Sessiyani burada
  // bitirmek istifadecini islemeyen sehifede saxlamaqdan yaxsidir.
  if (user && user.role !== "SUPER_ADMIN") {
    logout();
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  // Public: giriş etməmiş istifadəçi üçün. Şifrə sıfırlama linki e-poçtdan buraya gəlir.
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: "/", element: <TenantsPage /> },
          { path: "/leads", element: <LeadsPage /> },
          { path: "/usage", element: <UsagePage /> },
          { path: "/roles", element: <RolesPage /> },
          { path: "/settings", element: <SettingsPage /> },
          { path: "/tenants/:tenantKey", element: <TenantDetailPage /> },
          { path: "/tenants/:tenantKey/invoice", element: <InvoicePage /> },
          { path: "/tenants/:tenantKey/calls/:callId", element: <CallDetailPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
