import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { UpdateUserRoleVariables } from "./user.types";

export function useUserUpdateRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: UpdateUserRoleVariables) =>
      api.users.updateRole(
        variables.userId,
        variables.targetUserId,
        variables.role,
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users", variables.userId] });
    },
  });
}
