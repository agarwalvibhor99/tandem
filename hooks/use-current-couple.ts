import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { getSupabaseClient } from '@/lib/supabase/client';

export function useCurrentCouple() {
  const userId = useAuth().session?.user.id;
  return useQuery({
    queryKey: ['couple', userId], enabled: !!userId,
    queryFn: async ({ signal }) => {
      const { data, error } = await getSupabaseClient().from('couples').select('*').abortSignal(signal).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
