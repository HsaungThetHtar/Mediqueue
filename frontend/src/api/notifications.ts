import { api } from "./client";

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedBookingId?: string;
  createdAt: string;
}

export async function getNotifications(): Promise<Notification[]> {
  return api.get<Notification[]>("/notifications");
}

export async function markNotificationAsRead(id: string): Promise<Notification> {
  return api.patch<Notification>(`/notifications/${id}/read`);
}

export async function createNotification(data: Partial<Notification>): Promise<Notification> {
  return api.post<Notification>("/notifications", data);
}

export async function deleteNotification(id: string): Promise<{ success: boolean; _id: string }> {
  return api.delete<{ success: boolean; _id: string }>(`/notifications/${id}`);
}

export async function deleteAllNotifications(): Promise<{ success: boolean; deletedCount: number }> {
  return api.delete<{ success: boolean; deletedCount: number }>("/notifications");
}
