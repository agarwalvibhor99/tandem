import { focusManager, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, type PropsWithChildren } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCurrentCouple } from '@/hooks/use-current-couple';
import { useCoupleMembers } from '@/hooks/use-couple-members';
import { expenseKeys } from '@/hooks/use-expenses';
import { expenseIdSet, newPartnerExpenses } from '@/lib/expenses/changes';
import { notifyNewSharedExpense } from '@/lib/expenses/notifications';
import { subscribeToExpenses } from '@/lib/expenses/realtime';
import { getSupabaseClient } from '@/lib/supabase/client';
import { getExpenseApi } from '@/services/expenses';

export function ExpenseSyncProvider({ children }: PropsWithChildren) {
  const userId = useAuth().session?.user.id;
  const coupleId = useCurrentCouple().data?.id;
  const members = useCoupleMembers();
  const client = useQueryClient();
  const knownSharedIds = useRef<Set<string> | null>(null);
  useEffect(() => { knownSharedIds.current = null; }, [userId, coupleId]);
  useEffect(() => {
    if (!userId) return;
    const refresh = () => { void client.invalidateQueries({ queryKey: expenseKeys.all(userId) }); };
    const nameFor = (id: string) => id === userId ? 'You' : members.data?.find((member) => member.user_id === id)?.name ?? 'Your partner';
    const inspectSharedExpenses = async () => {
      if (!coupleId) return;
      try {
        const latest = await getExpenseApi().all('shared', coupleId);
        const added = newPartnerExpenses(latest, knownSharedIds.current, userId);
        knownSharedIds.current = expenseIdSet(latest);
        await Promise.all(added.slice(0, 3).map((expense) => notifyNewSharedExpense(expense, nameFor(expense.created_by))));
      } catch {
        // Realtime notifications should never interrupt expense syncing.
      }
    };
    if (coupleId && !knownSharedIds.current) void inspectSharedExpenses();
    const stop = subscribeToExpenses(getSupabaseClient(), userId, coupleId ?? null, refresh, () => { void inspectSharedExpenses(); });
    const unsubscribe = focusManager.subscribe((focused) => { if (focused) refresh(); });
    const fallback = setInterval(() => { if (focusManager.isFocused()) refresh(); }, 30_000);
    return () => { stop(); unsubscribe(); clearInterval(fallback); };
  }, [userId, coupleId, client, members.data]);
  return children;
}
