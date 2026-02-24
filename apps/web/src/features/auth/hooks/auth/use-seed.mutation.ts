import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useSeedMutation() {
  return useMutation({
    mutationFn: () => api.seed(),
  });
}
