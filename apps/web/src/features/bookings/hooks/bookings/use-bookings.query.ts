import { api } from "@/lib/api";
import type { PaginationMeta } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import type { Booking, UseBookingsQueryParams } from "./booking.types";

export type { Booking } from "./booking.types";

export interface BookingsListResult {
  data: Booking[];
  meta: PaginationMeta;
}

export function useBookingsQuery(params: UseBookingsQueryParams) {
  const {
    userId,
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    userIdFilter,
  } = params;
  return useQuery({
    queryKey: [
      "bookings",
      userId,
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      userIdFilter,
    ],
    queryFn: () =>
      api.bookings.list(userId!, {
        page,
        limit,
        search,
        sortBy,
        sortOrder,
        userId: userIdFilter,
      }),
    enabled: !!userId,
  });
}
