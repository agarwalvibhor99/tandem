import { focusManager, useQueryClient } from '@tanstack/react-query';
import { useEffect, type PropsWithChildren } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCurrentCouple } from '@/hooks/use-current-couple';
import { calendarKeys } from '@/hooks/use-calendar';
import { subscribeToCalendar } from '@/lib/calendar/realtime';
import { getSupabaseClient } from '@/lib/supabase/client';

export function CalendarSyncProvider({ children }: PropsWithChildren) {
  const userId = useAuth().session?.user.id;
  const coupleId = useCurrentCouple().data?.id ?? null;
  const client = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    const refresh = () => { void client.invalidateQueries({ queryKey: calendarKeys.all(userId) }); };
    const stop = subscribeToCalendar(getSupabaseClient(), userId, coupleId, refresh);
    const unsubscribe = focusManager.subscribe((focused) => { if (focused) refresh(); });
    const fallback = setInterval(() => { if (focusManager.isFocused()) refresh(); }, 30_000);
    return () => { stop(); unsubscribe(); clearInterval(fallback); };
  }, [userId, coupleId, client]);
  return children;
}
