import { api } from "./client";

export interface QueueStatus {
  queueNumber: string;
  currentlyServing: string;
  positionAhead: number;
  estimatedWaitMinutes: number;
  status: string;
}

export interface Booking {
  _id: string;
  queueNumber: string;
  hospital: string;
  department: string;
  doctor: string;
  doctorName: string;
  date: string;
  timeSlot: "morning" | "afternoon";
  estimatedTime: string;
  currentlyServing: string;
  patientId?: string;
  patientName?: string;
  status: "waiting" | "checked-in" | "in-progress" | "completed" | "canceled";
  createdAt: string;
  queueStatus?: QueueStatus;
}

export async function getQueueStatus(bookingId: string): Promise<QueueStatus> {
  return api.get<QueueStatus>(`/bookings/${bookingId}/queue-status`);
}

export interface CreateBookingPayload {
  doctorId: string;
  date: string;
  timeSlot: "morning" | "afternoon";
  patientName?: string;
  patientId?: string;
}

export async function createBooking(payload: CreateBookingPayload): Promise<Booking> {
  return api.post<Booking>("/bookings", payload);
}

export async function cancelBooking(bookingId: string): Promise<Booking> {
  return api.patch<Booking>(`/bookings/${bookingId}/cancel`);
}

export interface UpdateBookingPayload {
  doctorId?: string;
  date?: string;
  timeSlot?: "morning" | "afternoon";
}

export async function updateBooking(bookingId: string, payload: UpdateBookingPayload): Promise<Booking> {
  return api.patch<Booking>(`/bookings/${bookingId}`, payload);
}

export async function getMyBookings(patientId: string): Promise<Booking[]> {
  return api.get<Booking[]>(`/bookings?patientId=${patientId}`);
}

/** จำนวนคิวจริงต่อช่วง (เช้า/บ่าย) สำหรับหมอและวันที่กำหนด — ไม่นับ canceled */
export async function getSlotCounts(doctorId: string, date: string): Promise<{ morning: number; afternoon: number }> {
  const params = new URLSearchParams({ doctorId, date });
  return api.get<{ morning: number; afternoon: number }>(`/bookings/slot-counts?${params}`);
}
