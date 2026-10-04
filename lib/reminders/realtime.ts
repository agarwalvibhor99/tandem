import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export function subscribeToReminders(client: SupabaseClient<Database>, userId: string, coupleId: string | null, refresh: () => void) {
  let active = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => { if (!active || timer) return; timer = setTimeout(() => { timer = undefined; if (active) refresh(); }, 100); };
  const channels = [client.channel(`reminders:user:${userId}`, { config: { private: true } })];
  if (coupleId) channels.push(client.channel(`reminders:couple:${coupleId}`, { config: { private: true } }));
  channels.forEach((channel) => channel.on('broadcast', { event: 'reminders_changed' }, schedule).subscribe((status) => { if (status === 'SUBSCRIBED') schedule(); }));
  return () => { active = false; if (timer) clearTimeout(timer); channels.forEach((channel) => { void client.removeChannel(channel); }); };
}
