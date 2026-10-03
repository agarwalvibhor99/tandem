import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { getSupabaseClient } from '@/lib/supabase/client';
export function useCoupleInvite() {
  const userId = useAuth().session?.user.id;
  return useQuery({ queryKey: ['couple-invite', userId], enabled: !!userId, queryFn: async ({ signal }) => {
    const { data, error } = await getSupabaseClient().from('couple_invites').select('*').order('created_at', { ascending: false }).limit(1).abortSignal(signal).maybeSingle();
    if (error) throw error;
    return data;
  } });
}
