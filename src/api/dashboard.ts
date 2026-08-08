import { http } from "./client";
import type { DashboardData } from "./types";

export async function getDashboard(): Promise<DashboardData> {
  const { data } = await http.get<DashboardData>("/admin/dashboard");
  return data;
}
