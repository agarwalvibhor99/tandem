import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database.ts';
import type { ListInput, ListItem, ListItemInput } from '../../types/list.ts';
import { itemSchema, listSchema } from '../validation/list.ts';

export function createListApi(client: SupabaseClient<Database>) {
  return {
    async all(coupleId: string, signal?: AbortSignal) {
      let query = client.from('lists').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false });
      if (signal) query = query.abortSignal(signal);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    async get(id: string, signal?: AbortSignal) {
      let query = client.from('lists').select('*').eq('id', id);
      if (signal) query = query.abortSignal(signal);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data;
    },
    async items(listId: string, signal?: AbortSignal) {
      let query = client.from('list_items').select('*').eq('list_id', listId).order('created_at', { ascending: false }).limit(500);
      if (signal) query = query.abortSignal(signal);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    async remainingGroceries(signal?: AbortSignal) {
      const { data, error } = await client.rpc('remaining_grocery_items');
      if (error) throw error;
      return data;
    },
    async create(input: ListInput) {
      const { data, error } = await client.from('lists').insert(listSchema.parse(input)).select().single();
      if (error) throw error;
      return data;
    },
    async addItem(input: ListItemInput) {
      const parsed = itemSchema.parse(input);
      const { data, error } = await client.from('list_items').insert({ ...parsed, quantity: parsed.quantity || null }).select().single();
      if (error) throw error;
      return data;
    },
    async editItem(item: ListItem, input: ListItemInput) {
      const { list_id: _listId, ...changes } = itemSchema.parse(input);
      const { data, error } = await client.from('list_items').update({ ...changes, quantity: changes.quantity || null }).eq('id', item.id).eq('updated_at', item.updated_at).select().single();
      if (error) throw error;
      return data;
    },
    async completeItem(item: ListItem, completed: boolean) {
      const { data, error } = await client.from('list_items').update({ completed }).eq('id', item.id).eq('updated_at', item.updated_at).select().single();
      if (error) throw error;
      return data;
    },
    async removeItem(item: ListItem) {
      const { error } = await client.from('list_items').delete().eq('id', item.id).eq('updated_at', item.updated_at).select('id').single();
      if (error) throw error;
    },
  };
}
