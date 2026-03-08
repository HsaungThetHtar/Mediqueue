import { api } from "./client";

export interface SystemConfig {
  hospitalName: string;
  queuePerSession: number;
  queuePerDay: number;
  businessHours: string;
}

export async function getSystemConfig(): Promise<SystemConfig> {
  return api.get<SystemConfig>("/admin/settings/config");
}

export async function updateSystemConfig(data: Partial<SystemConfig>): Promise<SystemConfig> {
  return api.patch<SystemConfig>("/admin/settings/config", data);
}
