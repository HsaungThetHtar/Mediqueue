// ต้องเป็น URL เต็มของ backend ถ้าว่างหรือไม่ตั้งค่า Vite จะได้ HTML แทน JSON
const BASE_URL =
  (typeof import.meta.env.VITE_API_URL === "string" && import.meta.env.VITE_API_URL.trim())
    ? import.meta.env.VITE_API_URL.trim()
    : "http://localhost:3001";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();

  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    if (text.trimStart().startsWith("<!DOCTYPE") || text.trimStart().startsWith("<!doctype")) {
      throw new Error("Server returned HTML instead of JSON. Check that the backend is running (e.g. npm run dev in backend) and VITE_API_URL points to it.");
    }
    throw new Error("Invalid response from server.");
  }

  if (!res.ok) {
    throw new Error((data as { message?: string })?.message || "Request failed");
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export { BASE_URL };
