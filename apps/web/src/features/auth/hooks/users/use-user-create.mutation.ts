import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CreateUserVariables } from "./user.types";

export function useUserCreateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: CreateUserVariables) =>
      api.users.create(variables.userId, {
        name: variables.name,
        role: variables.role,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["users-for-login"] });
    },
  });
}
