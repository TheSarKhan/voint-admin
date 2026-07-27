import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { Layout } from "../components/Layout";
import { LoginPage } from "../pages/Login";
import { TenantsPage } from "../pages/Tenants";
import { TenantDetailPage } from "../pages/TenantDetail";
import { UsagePage } from "../pages/Usage";
import { InvoicePage } from "../pages/Invoice";
import { SettingsPage } from "../pages/Settings";

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
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: "/", element: <TenantsPage /> },
          { path: "/usage", element: <UsagePage /> },
          { path: "/settings", element: <SettingsPage /> },
          { path: "/tenants/:tenantId", element: <TenantDetailPage /> },
          { path: "/tenants/:tenantId/invoice", element: <InvoicePage /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
