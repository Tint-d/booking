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

/** Standard API response with optional meta (e.g. pagination) */
export interface ApiResponse<TData = unknown, TMeta = undefined> {
  status: "success" | "error";
  statusCode: number;
  message: string;
  data: TData;
  meta?: TMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface BookingsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "startTime" | "endTime" | "createdAt" | "userId";
  sortOrder?: "asc" | "desc";
  userId?: string;
}

export interface UsersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "name" | "role" | "createdAt";
  sortOrder?: "asc" | "desc";
  role?: Role;
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

/** Fetch CSV from backend and trigger download (used for full export, not current page). */
async function downloadCsv(path: string, userId: string, filename: string): Promise<void> {
  const headers: HeadersInit = { "X-User-Id": userId };
  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) throw new Error(res.statusText || "Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") search.set(k, String(v));
  }
  const q = search.toString();
  return q ? `?${q}` : "";
}

export const api = {
  seed: () =>
    request<ApiResponse<User>>("/users/seed", { method: "POST" }).then(
      (r) => r.data
    ),
  listUsersForLogin: () => request<User[]>("/users/for-login"),

  users: {
    list: (userId: string, params?: UsersQueryParams) => {
      const qs = buildQueryString(params ?? {});
      return request<ApiResponse<User[], PaginationMeta>>(`/users${qs}`, {
        userId,
      }).then((r) => ({ data: r.data, meta: r.meta! }));
    },
    create: (userId: string, body: { name: string; role: Role }) =>
      request<ApiResponse<User>>("/users", {
        method: "POST",
        userId,
        body: JSON.stringify(body),
      }).then((r) => r.data),
    updateRole: (userId: string, id: string, role: Role) =>
      request<ApiResponse<User>>(`/users/${id}/role`, {
        method: "PATCH",
        userId,
        body: JSON.stringify({ role }),
      }).then((r) => r.data),
    delete: (userId: string, id: string) =>
      request<ApiResponse<{ ok: boolean }>>(`/users/${id}`, {
        method: "DELETE",
        userId,
      }).then((r) => r.data),
    /** Server-side CSV export (all users). Admin only. */
    exportCsv: (userId: string) =>
      downloadCsv("/users/export", userId, "users.csv"),
  },

  bookings: {
    list: (userId: string, params?: BookingsQueryParams) => {
      const qs = buildQueryString(params ?? {});
      return request<ApiResponse<Booking[], PaginationMeta>>(`/bookings${qs}`, {
        userId,
      }).then((r) => ({ data: r.data, meta: r.meta! }));
    },
    create: (userId: string, body: { startTime: string; endTime: string }) =>
      request<ApiResponse<Booking>>("/bookings", {
        method: "POST",
        userId,
        body: JSON.stringify(body),
      }).then((r) => r.data),
    delete: (userId: string, id: string) =>
      request<ApiResponse<{ ok: boolean }>>(`/bookings/${id}`, {
        method: "DELETE",
        userId,
      }).then((r) => r.data),
    /** Server-side CSV export (all bookings the user can see). */
    exportCsv: (userId: string) =>
      downloadCsv("/bookings/export", userId, "bookings.csv"),
    summary: (userId: string) =>
      request<
        ApiResponse<{
          totalBookings: number;
          byUser: { userId: string; count: number }[];
        }>
      >("/bookings/summary", { userId }).then((r) => r.data),
    groupedByUser: (userId: string) =>
      request<ApiResponse<Record<string, Booking[]>>>(
        "/bookings/grouped-by-user",
        { userId },
      ).then((r) => r.data),
  },
};
