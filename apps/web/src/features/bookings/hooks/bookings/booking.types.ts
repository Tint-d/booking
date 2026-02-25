/**
 * Booking types – params and entities for bookings feature
 */

export type Role = "admin" | "owner" | "user";

export interface Booking {
  id: string;
  userId: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export interface BookingsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "startTime" | "endTime" | "createdAt" | "userId";
  sortOrder?: "asc" | "desc";
  userId?: string;
}

export interface UseBookingsQueryParams {
  userId: string | null;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "startTime" | "endTime" | "createdAt" | "userId";
  sortOrder?: "asc" | "desc";
  userIdFilter?: string;
}

export interface CreateBookingVariables {
  userId: string;
  startTime: string;
  endTime: string;
}

export interface DeleteBookingVariables {
  userId: string;
  bookingId: string;
}
