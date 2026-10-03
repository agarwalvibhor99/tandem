import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database.ts';

/** Realtime carries no event payload; it only prompts a masked, authorized refetch. */
export function subscribeToCalendar(client: SupabaseClient<Database>, userId: string, coupleId: string | null, refresh: () => void) {
  let active = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const topics = [`calendar:user:${userId}`, ...(coupleId ? [`calendar:couple:${coupleId}`] : [])];
  const schedule = () => { if (!active || timer) return; timer = setTimeout(() => { timer = undefined; if (active) refresh(); }, 100); };
  const channels = topics.map((topic) => client.channel(topic, { config: { private: true } })
    .on('broadcast', { event: 'calendar_changed' }, schedule)
    .subscribe((state) => { if (state === 'SUBSCRIBED') schedule(); }));
  return () => { active = false; if (timer) clearTimeout(timer); for (const channel of channels) void client.removeChannel(channel); };
}
