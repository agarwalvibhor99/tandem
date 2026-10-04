import { focusManager, useQueryClient } from '@tanstack/react-query';
import { useEffect, type PropsWithChildren } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCurrentCouple } from '@/hooks/use-current-couple';
import { dateIdeaKeys } from '@/hooks/use-date-ideas';
import { subscribeToDateIdeas } from '@/lib/dates/realtime';
import { getSupabaseClient } from '@/lib/supabase/client';

export function DateIdeaSyncProvider({ children }: PropsWithChildren) {
  const userId = useAuth().session?.user.id;
  const coupleId = useCurrentCouple().data?.id;
  const client = useQueryClient();
  useEffect(() => {
    if (!userId || !coupleId) return;
    const refresh = () => { void client.invalidateQueries({ queryKey: dateIdeaKeys.all(userId) }); };
    const stop = subscribeToDateIdeas(getSupabaseClient(), coupleId, refresh);
    const unsubscribe = focusManager.subscribe((focused) => { if (focused) refresh(); });
    const fallback = setInterval(() => { if (focusManager.isFocused()) refresh(); }, 30_000);
    return () => { stop(); unsubscribe(); clearInterval(fallback); };
  }, [userId, coupleId, client]);
  return children;
}
