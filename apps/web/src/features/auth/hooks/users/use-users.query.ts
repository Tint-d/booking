import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { UseUsersQueryParams } from "./user.types";

export function useUsersQuery(params: UseUsersQueryParams) {
  const { userId, enabled } = params;
  return useQuery({
    queryKey: ["users", userId],
    queryFn: () => api.users.list(userId!),
    enabled: !!userId && enabled,
  });
}
