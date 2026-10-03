import { QueryClient } from '@tanstack/react-query';

/** Create one client per mounted application, not per screen or render. */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 1,
      },
      // Mutations should not be replayed without feature-specific idempotency.
      mutations: { retry: false },
    },
  });
}
