import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export function subscribeToDateIdeas(client: SupabaseClient<Database>, coupleId: string, refresh: () => void) {
  let active = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => { if (active && !timer) timer = setTimeout(() => { timer = undefined; if (active) refresh(); }, 100); };
  const channel = client.channel(`dates:couple:${coupleId}`, { config: { private: true } })
    .on('broadcast', { event: 'date_ideas_changed' }, schedule)
    .subscribe((status) => { if (status === 'SUBSCRIBED') schedule(); });
  return () => { active = false; if (timer) clearTimeout(timer); void client.removeChannel(channel); };
}
