import { useQuery } from "@tanstack/react-query";
import { api, type Booking } from "@/lib/api";

export interface BookingsSummary {
  totalBookings: number;
  byUser: { userId: string; count: number }[];
}

export type BookingsGroupedByUser = Record<string, Booking[]>;

export function useBookingsSummaryQuery(userId: string | null) {
  return useQuery({
    queryKey: ["bookings-summary", userId],
    queryFn: () => api.bookings.summary(userId!),
    enabled: !!userId,
  });
}

export function useBookingsGroupedByUserQuery(userId: string | null) {
  return useQuery({
    queryKey: ["bookings-grouped-by-user", userId],
    queryFn: () => api.bookings.groupedByUser(userId!),
    enabled: !!userId,
  });
}

