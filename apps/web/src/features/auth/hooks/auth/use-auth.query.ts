import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useUsersForLoginQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["users-for-login"],
    queryFn: () => api.listUsersForLogin(),
    enabled,
  });
}
