import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCurrentCouple } from '@/hooks/use-current-couple';
import { getSupabaseClient } from '@/lib/supabase/client';
import { getPartnerNudgeApi } from '@/services/nudges';
import type { PartnerNudge, PartnerNudgeType } from '@/types/nudge';

export const nudgeKeys = { all: (userId: string, coupleId: string) => ['partner-nudges', userId, coupleId] as const };

export function usePartnerNudges(active = true) {
  const userId = useAuth().session?.user.id ?? '';
  const couple = useCurrentCouple();
  const coupleId = couple.data?.id ?? '';
  const client = useQueryClient();
  const query = useQuery({
    queryKey: nudgeKeys.all(userId, coupleId),
    enabled: !!userId && !!coupleId && active,
    queryFn: ({ signal }) => getPartnerNudgeApi().recent(coupleId, signal),
  });

  useEffect(() => {
    if (!userId || !coupleId || !active) return;
    const channel = getSupabaseClient().channel(`nudges:couple:${coupleId}`, { config: { private: true } })
      .on('broadcast', { event: 'nudge_created' }, () => { void client.invalidateQueries({ queryKey: nudgeKeys.all(userId, coupleId) }); })
      .subscribe();
    return () => { void getSupabaseClient().removeChannel(channel); };
  }, [active, client, coupleId, userId]);

  const send = useMutation({
    mutationFn: (type: PartnerNudgeType) => getPartnerNudgeApi().send(coupleId, type),
    onSuccess: (nudge) => client.setQueryData<PartnerNudge[]>(nudgeKeys.all(userId, coupleId), (current) => [nudge, ...(current ?? [])].slice(0, 20)),
  });
  return { couple, query, send };
}
