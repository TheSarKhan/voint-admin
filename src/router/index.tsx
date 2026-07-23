import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { Layout } from "../components/Layout";
import { LoginPage } from "../pages/Login";
import { TenantsPage } from "../pages/Tenants";
import { TenantDetailPage } from "../pages/TenantDetail";

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
          { path: "/tenants/:tenantId", element: <TenantDetailPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
