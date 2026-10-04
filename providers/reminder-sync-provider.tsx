import { focusManager, useQueryClient } from '@tanstack/react-query';
import { useEffect, type PropsWithChildren } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCurrentCouple } from '@/hooks/use-current-couple';
import { reminderKeys } from '@/hooks/use-reminders';
import { subscribeToReminders } from '@/lib/reminders/realtime';
import { getSupabaseClient } from '@/lib/supabase/client';

export function ReminderSyncProvider({ children }: PropsWithChildren) {
  const userId = useAuth().session?.user.id;
  const coupleId = useCurrentCouple().data?.id ?? null;
  const client = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    const refresh = () => { void client.invalidateQueries({ queryKey: reminderKeys.all(userId) }); };
    const stop = subscribeToReminders(getSupabaseClient(), userId, coupleId, refresh);
    const unsubscribe = focusManager.subscribe((focused) => { if (focused) refresh(); });
    const fallback = setInterval(() => { if (focusManager.isFocused()) refresh(); }, 30_000);
    return () => { stop(); unsubscribe(); clearInterval(fallback); };
  }, [userId, coupleId, client]);
  return children;
}
