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

export interface UseBookingsQueryParams {
  userId: string | null;
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
