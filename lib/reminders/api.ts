import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { Reminder, ReminderInput, ReminderVisibility } from '@/types/reminder';
import { reminderSchema } from '@/lib/validation/reminder';

export function createReminderApi(client: SupabaseClient<Database>) {
  return {
    async all(visibility: ReminderVisibility, coupleId: string | null, signal?: AbortSignal): Promise<Reminder[]> {
      let query = client.from('reminders').select('*').eq('visibility', visibility).order('completed').order('remind_at').limit(200);
      if (visibility === 'shared' && coupleId) query = query.eq('couple_id', coupleId);
      if (signal) query = query.abortSignal(signal);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    async upcomingShared(coupleId: string, now: string, signal?: AbortSignal): Promise<Reminder[]> {
      let query = client.from('reminders').select('*').eq('visibility', 'shared').eq('couple_id', coupleId).eq('completed', false).or(`remind_at.gte.${now},recurrence.neq.none`).order('remind_at').limit(100);
      if (signal) query = query.abortSignal(signal);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    async get(id: string, signal?: AbortSignal): Promise<Reminder | null> {
      let query = client.from('reminders').select('*').eq('id', id);
      if (signal) query = query.abortSignal(signal);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data;
    },
    async create(input: ReminderInput): Promise<Reminder> {
      const parsed = reminderSchema.parse(input);
      const { data, error } = await client.from('reminders').insert(parsed).select().single();
      if (error) throw error;
      return data;
    },
    async update(reminder: Reminder, input: ReminderInput): Promise<Reminder> {
      const parsed = reminderSchema.parse(input);
      const { data, error } = await client.from('reminders').update(parsed).eq('id', reminder.id).eq('updated_at', reminder.updated_at).select().single();
      if (error) throw error;
      return data;
    },
    async complete(reminder: Reminder, completed: boolean): Promise<Reminder> {
      const { data, error } = await client.from('reminders').update({ completed }).eq('id', reminder.id).eq('updated_at', reminder.updated_at).select().single();
      if (error) throw error;
      return data;
    },
    async remove(reminder: Reminder): Promise<void> {
      const { error } = await client.from('reminders').delete().eq('id', reminder.id).eq('updated_at', reminder.updated_at).select('id').single();
      if (error) throw error;
    },
  };
}
