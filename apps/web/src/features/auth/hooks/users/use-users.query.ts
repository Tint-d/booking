import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { UseUsersQueryParams } from "./user.types";

export function useUsersQuery(params: UseUsersQueryParams) {
  const {
    userId,
    enabled,
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    role,
  } = params;
  return useQuery({
    queryKey: ["users", userId, page, limit, search, sortBy, sortOrder, role],
    queryFn: () =>
      api.users.list(userId!, {
        page,
        limit,
        search,
        sortBy,
        sortOrder,
        role,
      }),
    enabled: !!userId && enabled,
  });
}
