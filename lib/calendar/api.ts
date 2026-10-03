import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database.ts';
import type { CalendarEvent, CalendarEventInput } from '../../types/calendar.ts';
import { calendarEventSchema } from '../validation/calendar.ts';

export function createCalendarApi(client: SupabaseClient<Database>) {
  return {
    async window(start: string, end: string, signal?: AbortSignal) {
      let query = client.rpc('get_calendar_window', { window_start: start, window_end: end });
      if (signal) query = query.abortSignal(signal);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    async get(id: string, signal?: AbortSignal) {
      let query = client.from('calendar_events').select('*').eq('id', id);
      if (signal) query = query.abortSignal(signal);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data;
    },
    async create(input: CalendarEventInput) {
      const { data, error } = await client.from('calendar_events').insert(calendarEventSchema.parse(input)).select().single();
      if (error) throw error;
      return data;
    },
    async edit(event: CalendarEvent, input: CalendarEventInput) {
      const { data, error } = await client.from('calendar_events').update(calendarEventSchema.parse(input)).eq('id', event.id).eq('updated_at', event.updated_at).select().single();
      if (error) throw error;
      return data;
    },
    async remove(event: CalendarEvent) {
      const { error } = await client.from('calendar_events').delete().eq('id', event.id).eq('updated_at', event.updated_at).select('id').single();
      if (error) throw error;
    },
  };
}
