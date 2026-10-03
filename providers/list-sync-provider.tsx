import { focusManager, useQueryClient } from '@tanstack/react-query';
import { useEffect, type PropsWithChildren } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCurrentCouple } from '@/hooks/use-current-couple';
import { listKeys } from '@/hooks/use-lists';
import { subscribeToLists } from '@/lib/lists/realtime';
import { getSupabaseClient } from '@/lib/supabase/client';

export function ListSyncProvider({ children }: PropsWithChildren) {
  const userId = useAuth().session?.user.id;
  const coupleId = useCurrentCouple().data?.id;
  const client = useQueryClient();
  useEffect(() => {
    if (!userId || !coupleId) return;
    const refresh = () => { void client.invalidateQueries({ queryKey: listKeys.all(userId) }); };
    const stop = subscribeToLists(getSupabaseClient(), coupleId, refresh);
    const unsubscribe = focusManager.subscribe((focused) => { if (focused) refresh(); });
    const fallback = setInterval(() => { if (focusManager.isFocused()) refresh(); }, 30_000);
    return () => { stop(); unsubscribe(); clearInterval(fallback); };
  }, [userId, coupleId, client]);
  return children;
}
