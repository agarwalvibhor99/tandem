import { QueryClientProvider } from '@tanstack/react-query';
import { useState, type PropsWithChildren } from 'react';

import { useQueryLifecycle } from '@/hooks/use-query-lifecycle';
import { createQueryClient } from '@/lib/queries/client';
import { AuthProvider } from '@/providers/auth-provider';

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(createQueryClient);
  useQueryLifecycle();

  return <QueryClientProvider client={queryClient}><AuthProvider>{children}</AuthProvider></QueryClientProvider>;
}
