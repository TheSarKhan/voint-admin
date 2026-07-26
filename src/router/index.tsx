import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { Layout } from "../components/Layout";
import { LoginPage } from "../pages/Login";
import { TenantsPage } from "../pages/Tenants";
import { TenantDetailPage } from "../pages/TenantDetail";
import { UsagePage } from "../pages/Usage";
import { InvoicePage } from "../pages/Invoice";

function ProtectedRoute() {
  const token = useAuthStore((s) => s.token);
  if (!token) {
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
          { path: "/tenants/:tenantId", element: <TenantDetailPage /> },
          { path: "/tenants/:tenantId/invoice", element: <InvoicePage /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
