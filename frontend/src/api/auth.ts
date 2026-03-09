import { api } from "./client";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  role: "patient" | "admin" | "doctor";
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface SignUpData {
  fullName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  identificationNumber?: string;
  password: string;
}

export async function signUp(data: SignUpData): Promise<AuthResponse> {
  return api.post<AuthResponse>("/auth/signup", data);
}

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  return api.post<AuthResponse>("/auth/signin", { email, password });
}

export function saveSession(token: string, user: AuthUser) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function getSession(): AuthUser | null {
  const raw = localStorage.getItem("user");
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
