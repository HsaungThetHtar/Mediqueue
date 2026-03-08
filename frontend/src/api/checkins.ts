import { api } from "./client";

export interface CheckIn {
  _id: string;
  bookingId: string;
  patientId: string;
  checkInTime: string;
  method: "qr" | "manual";
  status: "pending" | "confirmed" | "completed";
  notes?: string;
}

export interface CreateCheckInPayload {
  bookingId: string;
  method: "qr" | "manual";
  notes?: string;
}

export async function createCheckIn(payload: CreateCheckInPayload): Promise<CheckIn> {
  return api.post<CheckIn>("/checkin", payload);
}

export async function getCheckInStatus(bookingId: string): Promise<CheckIn | null> {
  return api.get<CheckIn | null>(`/checkin/${bookingId}`);
}

export interface ValidatedBooking {
  id: string;
  queueNumber: string;
  doctor: string;
  doctorName: string;
  department: string;
  hospital: string;
  date: string;
  time: string;
  timeSlot: string;
  estimatedTime?: string;
}

export async function validateCheckInCode(code: string): Promise<ValidatedBooking> {
  return api.get<ValidatedBooking>(`/checkin/validate?code=${encodeURIComponent(code)}`);
}

// Admin-side manual check-in (staff triggers check-in for a booking)
export async function adminCheckIn(bookingId: string, notes?: string): Promise<CheckIn> {
  return api.post<CheckIn>(`/admin/queues/${bookingId}/checkin`, {
    notes: notes || "",
  });
}

// Admin: get check-in history for a specific patient
export async function getCheckInsByPatient(patientId: string): Promise<CheckIn[]> {
  return api.get<CheckIn[]>(`/admin/checkins?patientId=${encodeURIComponent(patientId)}`);
}

// Admin: get all check-ins for a date (for Check-ins page)
export interface CheckInWithBooking extends CheckIn {
  bookingId: {
    _id: string;
    queueNumber: string;
    doctorName: string;
    date: string;
    timeSlot: string;
    status: string;
    department?: string;
    patientName?: string;
    estimatedTime?: string;
  };
}
export async function getCheckInsForDate(date: string): Promise<CheckInWithBooking[]> {
  return api.get<CheckInWithBooking[]>(`/admin/checkins?date=${encodeURIComponent(date)}`);
}
