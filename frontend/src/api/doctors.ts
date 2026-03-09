import { api } from "./client";

export interface Doctor {
  _id: string;
  name: string;
  department: string;
  availability: "available" | "nearlyFull" | "full";
  workingHours: string;
  currentQueueServing: number;
  imageUrl: string;
  currentQueue: number;
  maxQueue: number;
  userId?: string;
}

export interface DoctorWithDateCount extends Doctor {
  dateQueueCount?: number;
}

export async function getDoctors(department?: string, date?: string): Promise<DoctorWithDateCount[]> {
  const params = new URLSearchParams();
  if (department) params.set("department", department);
  if (date) params.set("date", date);
  const query = params.toString() ? `?${params.toString()}` : "";
  return api.get<DoctorWithDateCount[]>(`/doctors${query}`);
}

export async function getDoctorsByUserId(userId: string): Promise<Doctor[]> {
  const query = `?userId=${encodeURIComponent(userId)}`;
  return api.get<Doctor[]>(`/doctors${query}`);
}

/** คิวของหมอที่ล็อกอิน (ใช้ใน Doctor Dashboard) — ต้องส่ง token */
export async function getMyQueues(date: string): Promise<any[]> {
  const query = `?date=${encodeURIComponent(date)}`;
  return api.get<any[]>(`/doctors/me/queues${query}`);
}

export async function updatePatientStatus(
  doctorId: string,
  bookingId: string,
  status: string
): Promise<any> {
  return api.patch<any>(`/doctors/${doctorId}/status`, { bookingId, status });
}

export async function saveBookingNotes(
  doctorId: string,
  bookingId: string,
  doctorNotes: string
): Promise<any> {
  return api.patch<any>(`/doctors/${doctorId}/booking-notes`, { bookingId, doctorNotes });
}

export async function createDoctor(data: {
  name: string;
  departmentId: string;
  workingHours?: string;
  imageUrl?: string;
  email?: string;
  password?: string;
}): Promise<DoctorWithDateCount> {
  return api.post<DoctorWithDateCount>("/doctors", data);
}

export async function updateDoctor(
  id: string,
  data: {
    name?: string;
    departmentId?: string;
    workingHours?: string;
    imageUrl?: string;
    email?: string;
    password?: string;
    unlinkUser?: boolean;
  }
): Promise<DoctorWithDateCount> {
  return api.patch<DoctorWithDateCount>(`/doctors/${id}`, data);
}

export async function deleteDoctor(id: string): Promise<{ deleted: boolean; id: string }> {
  return api.delete<{ deleted: boolean; id: string }>(`/doctors/${id}`);
}
