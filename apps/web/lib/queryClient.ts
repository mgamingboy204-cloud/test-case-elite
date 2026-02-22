import { QueryClient } from "@tanstack/react-query";

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount) => failureCount < 1,
        staleTime: 15000,
        refetchOnWindowFocus: true
      },
      mutations: {
        retry: 0
      }
    }
  });
