import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/hooks/use-auth';
import { getSupabaseClient } from '@/lib/supabase/client';

export function useProfile() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ['profile', userId],
    enabled: !!userId,
    queryFn: async ({ signal }) => {
      if (!userId) throw new Error('A session is required.');
      const { data, error } = await getSupabaseClient().from('profiles')
        .select('id, name, email, avatar_url, timezone, couple_onboarding_skipped_at, created_at, updated_at')
        .eq('id', userId).abortSignal(signal).single();
      if (error) throw error;
      return data;
    },
  });
}
