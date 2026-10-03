import { focusManager, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCurrentCouple } from '@/hooks/use-current-couple';
import { getSupabaseClient } from '@/lib/supabase/client';
import { taskKeys } from '@/lib/tasks/optimistic';
import { subscribeToTasks } from '@/lib/tasks/realtime';

const TaskSyncContext = createContext(false);
export const useTaskSync = () => useContext(TaskSyncContext);
export function TaskSyncProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const couple = useCurrentCouple();
  const coupleId = couple.data?.id ?? null;
  const queryClient = useQueryClient();
  const [healthy, setHealthy] = useState(false);
  useEffect(() => {
    if (!userId) return;
    const refresh = () => { void queryClient.invalidateQueries({ queryKey: taskKeys.all(userId) }); };
    const stop = subscribeToTasks(getSupabaseClient(), userId, coupleId, refresh, setHealthy);
    const focus = focusManager.subscribe((focused) => { if (focused) refresh(); });
    // Reconcile missed events / unavailable sockets without silently going stale.
    const fallback = setInterval(() => { if (focusManager.isFocused()) refresh(); }, 30_000);
    return () => { stop(); focus(); clearInterval(fallback); };
  }, [userId, coupleId, queryClient]);
  return <TaskSyncContext.Provider value={healthy}>{children}</TaskSyncContext.Provider>;
}
