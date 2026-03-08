import { api } from "./client";
import { Booking } from "./bookings";

export interface QueueItem extends Booking {
  // booking fields are reused
}

export async function getQueueById(id: string): Promise<QueueItem> {
  return api.get<QueueItem>(`/admin/queues/${id}`);
}

export async function getQueues(params: {
  date?: string;
  timeSlot?: string;
  status?: string;
  doctor?: string;
} = {}): Promise<QueueItem[]> {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) queryParams.append(k, v as string);
  });
  const query = queryParams.toString();
  return api.get<QueueItem[]>(`/admin/queues${query ? `?${query}` : ""}`);
}

export async function callQueue(id: string): Promise<QueueItem> {
  return api.post<QueueItem>(`/admin/queues/${id}/call`, {});
}

export async function skipQueue(id: string): Promise<QueueItem> {
  return api.post<QueueItem>(`/admin/queues/${id}/skip`, {});
}

export async function completeQueue(id: string): Promise<QueueItem> {
  return api.post<QueueItem>(`/admin/queues/${id}/complete`, {});
}

export async function updateQueueStatus(id: string, status: string): Promise<QueueItem> {
  return api.patch<QueueItem>(`/admin/queues/${id}/status`, { status });
}
