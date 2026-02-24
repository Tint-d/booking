import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import type { UseBookingsQueryParams } from "./booking.types";

export type { Booking } from "./booking.types";

export function useBookingsQuery(params: UseBookingsQueryParams) {
  const { userId } = params;
  return useQuery({
    queryKey: ["bookings", userId],
    queryFn: () => api.bookings.list(userId!),
    enabled: !!userId,
  });
}
