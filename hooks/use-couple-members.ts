import type { CoupleMember } from '@/types/database';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { getSupabaseClient } from '@/lib/supabase/client';

/** Poll only while a connection screen is visible; Query pauses in the background. */
export function useCoupleMembers(watch = false, pollInterval = 3000) {
  const userId = useAuth().session?.user.id;
  return useQuery<CoupleMember[]>({
    queryKey: ['couple-members', userId], enabled: !!userId,
    refetchInterval: (query) => watch && (!query.state.data || query.state.data.length === 1) ? pollInterval : false,
    queryFn: async ({ signal }) => {
      const { data, error } = await getSupabaseClient().rpc('get_couple_members').abortSignal(signal);
      if (error) throw error;
      return data;
    },
  });
}
