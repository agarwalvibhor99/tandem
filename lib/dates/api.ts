import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { DateIdea, DateIdeaInput } from '@/types/date-idea';
import { dateIdeaSchema } from '@/lib/validation/date-idea';

export function createDateIdeaApi(client: SupabaseClient<Database>) {
  return {
    async all(coupleId: string, signal?: AbortSignal): Promise<DateIdea[]> {
      let query = client.from('date_ideas').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false }).limit(200);
      if (signal) query = query.abortSignal(signal);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    async get(id: string, signal?: AbortSignal): Promise<DateIdea | null> {
      let query = client.from('date_ideas').select('*').eq('id', id);
      if (signal) query = query.abortSignal(signal);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data;
    },
    async create(input: DateIdeaInput): Promise<DateIdea> {
      const { data, error } = await client.from('date_ideas').insert(dateIdeaSchema.parse(input)).select().single();
      if (error) throw error;
      return data;
    },
    async update(idea: DateIdea, input: DateIdeaInput): Promise<DateIdea> {
      const { couple_id: _coupleId, ...changes } = dateIdeaSchema.parse(input);
      const { data, error } = await client.from('date_ideas').update(changes).eq('id', idea.id).eq('updated_at', idea.updated_at).select().single();
      if (error) throw error;
      return data;
    },
    async setStatus(idea: DateIdea, status: DateIdea['status']): Promise<DateIdea> {
      const { data, error } = await client.from('date_ideas').update({ status }).eq('id', idea.id).eq('updated_at', idea.updated_at).select().single();
      if (error) throw error;
      return data;
    },
  };
}
