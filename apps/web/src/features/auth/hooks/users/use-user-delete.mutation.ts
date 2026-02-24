import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DeleteUserVariables } from "./user.types";

export function useUserDeleteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: DeleteUserVariables) =>
      api.users.delete(variables.userId, variables.targetUserId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}
