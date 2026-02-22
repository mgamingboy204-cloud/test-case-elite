import { QueryClient } from "@tanstack/react-query";

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, _error, query) => {
          if (query.queryKey[0] === "me") {
            return false;
          }
          return failureCount < 1;
        },
        staleTime: 15000,
        refetchOnWindowFocus: true
      },
      mutations: {
        retry: 0
      }
    }
  });
