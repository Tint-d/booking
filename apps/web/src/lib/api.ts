const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type Role = "admin" | "owner" | "user";

export interface User {
  id: string;
  name: string;
  role: Role;
}

export interface Booking {
  id: string;
  userId: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

async function request<T>(
  path: string,
  options: RequestInit & { userId?: string } = {},
): Promise<T> {
  const { userId, ...init } = options;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (userId) headers["X-User-Id"] = userId;

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const text = await res.text();
  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = JSON.parse(text);
      if (data.message)
        message = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message;
    } catch {
      if (text) message = text;
    }
    throw new Error(message);
  }
  return text ? JSON.parse(text) : (undefined as T);
}

export const api = {
  seed: () => request<User>("/users/seed", { method: "POST" }),
  listUsersForLogin: () => request<User[]>("/users/for-login"),

  users: {
    list: (userId: string) => request<User[]>("/users", { userId }),
    create: (userId: string, body: { name: string; role: Role }) =>
      request<User>("/users", {
        method: "POST",
        userId,
        body: JSON.stringify(body),
      }),
    updateRole: (userId: string, id: string, role: Role) =>
      request<User>(`/users/${id}/role`, {
        method: "PATCH",
        userId,
        body: JSON.stringify({ role }),
      }),
    delete: (userId: string, id: string) =>
      request<{ ok: boolean }>(`/users/${id}`, { method: "DELETE", userId }),
  },

  bookings: {
    list: (userId: string) => request<Booking[]>("/bookings", { userId }),
    create: (userId: string, body: { startTime: string; endTime: string }) =>
      request<Booking>("/bookings", {
        method: "POST",
        userId,
        body: JSON.stringify(body),
      }),
    delete: (userId: string, id: string) =>
      request<{ ok: boolean }>(`/bookings/${id}`, { method: "DELETE", userId }),
    summary: (userId: string) =>
      request<{
        totalBookings: number;
        byUser: { userId: string; count: number }[];
      }>("/bookings/summary", { userId }),
  },
};
