import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CreateBookingVariables } from "./booking.types";

export function useBookingCreateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: CreateBookingVariables) =>
      api.bookings.create(variables.userId, {
        startTime: variables.startTime,
        endTime: variables.endTime,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["bookings-summary"] });
    },
  });
}
