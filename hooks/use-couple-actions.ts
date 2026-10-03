import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { getSupabaseClient } from '@/lib/supabase/client';
import { acceptCoupleInvite, createCouple, generateCoupleInvite } from '@/services/couples';

export function useCoupleActions() {
  const userId = useAuth().session?.user.id;
  const client = useQueryClient();
  const refresh = async () => {
    await Promise.all(['couple', 'couple-members', 'couple-invite'].map((key) => client.invalidateQueries({ queryKey: [key, userId] })));
  };
  const create = useMutation({ mutationFn: createCouple, onSuccess: refresh, onError: refresh });
  const join = useMutation({ mutationFn: acceptCoupleInvite, onSuccess: refresh, onError: refresh });
  const invite = useMutation({ mutationFn: generateCoupleInvite, onSuccess: (data) => { client.setQueryData(['couple-invite', userId], data); } });
  const skip = useMutation({ mutationFn: async () => {
    if (!userId) throw new Error('AUTH_REQUIRED');
    const { error } = await getSupabaseClient().from('profiles').update({ couple_onboarding_skipped_at: new Date().toISOString() }).eq('id', userId);
    if (error) throw error;
  }, onSuccess: () => client.invalidateQueries({ queryKey: ['profile', userId] }) });
  return { create, join, invite, skip };
}
