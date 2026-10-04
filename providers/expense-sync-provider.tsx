import { focusManager, useQueryClient } from '@tanstack/react-query';
import { useEffect, type PropsWithChildren } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCurrentCouple } from '@/hooks/use-current-couple';
import { expenseKeys } from '@/hooks/use-expenses';
import { subscribeToExpenses } from '@/lib/expenses/realtime';
import { getSupabaseClient } from '@/lib/supabase/client';

export function ExpenseSyncProvider({ children }: PropsWithChildren) {
  const userId = useAuth().session?.user.id;
  const coupleId = useCurrentCouple().data?.id;
  const client = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    const refresh = () => { void client.invalidateQueries({ queryKey: expenseKeys.all(userId) }); };
    const stop = subscribeToExpenses(getSupabaseClient(), userId, coupleId ?? null, refresh);
    const unsubscribe = focusManager.subscribe((focused) => { if (focused) refresh(); });
    const fallback = setInterval(() => { if (focusManager.isFocused()) refresh(); }, 30_000);
    return () => { stop(); unsubscribe(); clearInterval(fallback); };
  }, [userId, coupleId, client]);
  return children;
}
