import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DeleteBookingVariables } from "./booking.types";

export function useBookingDeleteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: DeleteBookingVariables) =>
      api.bookings.delete(variables.userId, variables.bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}
