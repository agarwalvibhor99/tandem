import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database.ts';

/** No payload is trusted or inserted into cache; every event triggers RLS reads. */
export function subscribeToTasks(client: SupabaseClient<Database>, userId: string, coupleId: string | null, refresh: () => void, status: (healthy: boolean) => void) {
  let active = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const ready = new Set<string>();
  const topics = [`tasks:user:${userId}`, ...(coupleId ? [`tasks:couple:${coupleId}`] : [])];
  const schedule = () => { if (!active || timer) return; timer = setTimeout(() => { timer = undefined; if (active) refresh(); }, 100); };
  const channels = topics.map((topic) => client.channel(topic, { config: { private: true } })
    .on('broadcast', { event: 'tasks_changed' }, schedule)
    .subscribe((state) => {
      if (!active) return;
      if (state === 'SUBSCRIBED') { ready.add(topic); schedule(); }
      else ready.delete(topic);
      status(ready.size === topics.length);
    }));
  return () => {
    active = false;
    if (timer) clearTimeout(timer);
    for (const channel of channels) void client.removeChannel(channel);
  };
}
