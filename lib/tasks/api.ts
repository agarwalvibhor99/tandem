import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database.ts';
import type { Task, TaskFilter, TaskInput } from '../../types/task.ts';
import { taskSchema } from '../validation/task.ts';

export const TASK_PAGE_SIZE = 30;
export function createTaskApi(client: SupabaseClient<Database>) {
  return {
    async countShared(signal?: AbortSignal) {
      let query = client.from('tasks').select('id', { count: 'exact', head: true }).eq('visibility', 'shared').eq('status', 'open');
      if (signal) query = query.abortSignal(signal);
      const { count, error } = await query;
      if (error) throw error;
      if (count === null) throw new Error('Task count unavailable');
      return count;
    },
    async list(filter: TaskFilter, userId: string, tomorrow: string, page: number, signal?: AbortSignal) {
      let query = client.from('tasks').select('*').eq('status', filter === 'Completed' ? 'completed' : 'open');
      switch (filter) {
        case 'Today': query = query.lt('due_at', tomorrow); break;
        case 'Upcoming': query = query.or(`due_at.gte.${tomorrow},due_at.is.null`); break;
        case 'Mine': query = query.or(`visibility.eq.private,assigned_to.eq.${userId}`); break;
        case 'Partner': query = query.eq('visibility', 'shared').not('assigned_to', 'is', null).neq('assigned_to', userId); break;
        case 'Shared': query = query.eq('visibility', 'shared'); break;
      }
      query = query.order(filter === 'Completed' ? 'completed_at' : 'due_at', { ascending: filter !== 'Completed', nullsFirst: false }).order('id').range(page * TASK_PAGE_SIZE, (page + 1) * TASK_PAGE_SIZE - 1);
      if (signal) query = query.abortSignal(signal);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    async get(id: string, signal?: AbortSignal) {
      let query = client.from('tasks').select('*').eq('id', id);
      if (signal) query = query.abortSignal(signal);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data;
    },
    async create(input: TaskInput) {
      const { data, error } = await client.from('tasks').insert(taskSchema.parse(input)).select().single();
      if (error) throw error;
      return data;
    },
    async edit(task: Task, input: TaskInput) {
      const { data, error } = await client.from('tasks').update(taskSchema.parse(input)).eq('id', task.id).eq('updated_at', task.updated_at).select().single();
      if (error) throw error;
      return data;
    },
    async complete(task: Task, status: Task['status']) {
      const { data, error } = await client.from('tasks').update({ status }).eq('id', task.id).eq('updated_at', task.updated_at).select().single();
      if (error) throw error;
      return data;
    },
    async remove(task: Task) {
      const { error } = await client.from('tasks').delete().eq('id', task.id).eq('updated_at', task.updated_at).select('id').single();
      if (error) throw error;
    },
  };
}
