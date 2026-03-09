import { api } from "./client";

/**
 * ดึงรายการแผนกจาก collection departments (เรียงตาม displayOrder)
 */
export async function getDepartments(): Promise<string[]> {
  const list = await api.get<string[]>("/departments");
  return Array.isArray(list) ? list : [];
}

export interface DepartmentItem {
  _id: string;
  name: string;
  displayOrder: number;
}

/**
 * ดึงรายการแผนกแบบเต็ม (สำหรับแอดมินจัดการ)
 */
export async function getDepartmentsFull(): Promise<DepartmentItem[]> {
  const list = await api.get<DepartmentItem[]>("/departments?full=1");
  return Array.isArray(list) ? list : [];
}

export async function createDepartment(data: { name: string; displayOrder?: number }): Promise<DepartmentItem> {
  return api.post<DepartmentItem>("/departments", data);
}

export async function updateDepartment(id: string, data: { name?: string; displayOrder?: number }): Promise<DepartmentItem> {
  return api.patch<DepartmentItem>(`/departments/${id}`, data);
}

export async function deleteDepartment(id: string): Promise<{ deleted: boolean; id: string }> {
  return api.delete<{ deleted: boolean; id: string }>(`/departments/${id}`);
}
