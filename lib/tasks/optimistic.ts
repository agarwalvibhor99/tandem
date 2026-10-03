import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import type { Task, TaskFilter } from '../../types/task.ts';
import { taskMatches } from './filters.ts';

export type CompletionChange = { task: Task; status: Task['status'] };
export const taskKeys = {
  all: (userId: string) => ['tasks', userId] as const,
  detail: (userId: string, id: string) => ['tasks', userId, 'detail', id] as const,
  completion: (userId: string) => ['task-completion', userId] as const,
};
/** Overlay pending changes rather than restoring whole-list snapshots on error.
 * This keeps one failed checkbox from undoing other successful task changes. */
export function projectTask(task: Task, pending: CompletionChange[]): Task {
  const change = pending.find((entry) => entry.task.id === task.id);
  return change ? { ...task, status: change.status, completed_at: change.status === 'completed' ? task.completed_at ?? task.updated_at : null } : task;
}
export function projectTaskList(tasks: Task[], pending: CompletionChange[], filter: TaskFilter, userId: string, tomorrow: string) {
  const combined = new Map(tasks.map((task) => [task.id, task]));
  for (const { task } of pending) if (!combined.has(task.id)) combined.set(task.id, task);
  return [...combined.values()].map((task) => projectTask(task, pending)).filter((task) => taskMatches(task, filter, userId, tomorrow));
}
export function completionOptions(client: QueryClient, userId: string, save: (task: Task, status: Task['status']) => Promise<Task>) {
  return {
    mutationKey: taskKeys.completion(userId),
    networkMode: 'always' as const,
    retry: false as const,
    mutationFn: ({ task, status }: CompletionChange) => save(task, status),
    onMutate: async () => { await client.cancelQueries({ queryKey: taskKeys.all(userId) }); },
    onSuccess: (task: Task) => {
      client.setQueryData(taskKeys.detail(userId, task.id), task);
      // Keep a successful save even if the subsequent refresh loses connectivity.
      client.setQueriesData<InfiniteData<Task[]>>({ queryKey: [...taskKeys.all(userId), 'list'] }, (data) => data ? {
        ...data, pages: data.pages.map((page) => page.map((row) => row.id === task.id ? task : row)),
      } : data);
    },
    onSettled: async () => { await client.invalidateQueries({ queryKey: taskKeys.all(userId) }); },
  };
}
