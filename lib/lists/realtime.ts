import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database.ts';

export function subscribeToLists(client: SupabaseClient<Database>, coupleId: string, refresh: () => void) {
  let active = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const topic = `lists:couple:${coupleId}`;
  const schedule = () => { if (!active || timer) return; timer = setTimeout(() => { timer = undefined; if (active) refresh(); }, 100); };
  const channel = client.channel(topic, { config: { private: true } })
    .on('broadcast', { event: 'lists_changed' }, schedule)
    .subscribe((status) => { if (status === 'SUBSCRIBED') schedule(); });
  return () => { active = false; if (timer) clearTimeout(timer); void client.removeChannel(channel); };
}
