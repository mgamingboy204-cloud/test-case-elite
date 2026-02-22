import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api";

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
            return false;
          }
          return failureCount < 1;
        },
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false
      },
      mutations: {
        retry: 0
      }
    }
  });
