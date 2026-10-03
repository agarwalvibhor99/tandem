import { useInfiniteQuery, useMutation, useMutationState, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { taskDateBounds } from '@/lib/tasks/filters';
import { completionOptions, taskKeys, type CompletionChange } from '@/lib/tasks/optimistic';
import { TASK_PAGE_SIZE } from '@/lib/tasks/api';
import { getTaskApi } from '@/services/tasks';
import type { Task, TaskFilter, TaskInput } from '@/types/task';

export function useTaskClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(timer); }, []);
  return { ...taskDateBounds(now), now };
}
export function useTasks(filter: TaskFilter, tomorrow: string, active = true) {
  const userId = useAuth().session?.user.id ?? '';
  return useInfiniteQuery({
    queryKey: [...taskKeys.all(userId), 'list', filter, tomorrow], enabled: !!userId && active,
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => getTaskApi().list(filter, userId, tomorrow, pageParam, signal),
    getNextPageParam: (last, pages) => last.length === TASK_PAGE_SIZE ? pages.length : undefined,
  });
}
export function useTask(id: string) {
  const userId = useAuth().session?.user.id ?? '';
  return useQuery({ queryKey: taskKeys.detail(userId, id), enabled: !!userId && !!id, queryFn: ({ signal }) => z.string().uuid().safeParse(id).success ? getTaskApi().get(id, signal) : Promise.resolve(null) });
}
export function usePendingCompletions() {
  const userId = useAuth().session?.user.id ?? '';
  return useMutationState({ filters: { mutationKey: taskKeys.completion(userId), status: 'pending' },
    // Only completionOptions writes this key, with CompletionChange variables.
    select: (mutation) => mutation.state.variables as CompletionChange,
  });
}
export function useTaskActions() {
  const userId = useAuth().session?.user.id ?? '';
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: taskKeys.all(userId) });
  const create = useMutation({ mutationFn: (input: TaskInput) => getTaskApi().create(input), networkMode: 'always', onSuccess: refresh });
  const edit = useMutation({ mutationFn: ({ task, input }: { task: Task; input: TaskInput }) => getTaskApi().edit(task, input), networkMode: 'always', onSuccess: refresh });
  const remove = useMutation({ mutationFn: (task: Task) => getTaskApi().remove(task), networkMode: 'always', onSuccess: refresh });
  const complete = useMutation(completionOptions(client, userId, (task, status) => getTaskApi().complete(task, status)));
  return { create, edit, remove, complete };
}

/** Surface failures from fast checkbox actions, even if another action finished later. */
export function useCompletionFailures() {
  const userId = useAuth().session?.user.id ?? '';
  const attempts = useMutationState({ filters: { mutationKey: taskKeys.completion(userId) }, select: (mutation) => ({
    change: mutation.state.variables as CompletionChange | undefined,
    error: mutation.state.error, status: mutation.state.status, submittedAt: mutation.state.submittedAt,
  }) });
  const latest = new Map<string, typeof attempts[number]>();
  for (const attempt of attempts) {
    const id = attempt.change?.task.id;
    if (id && attempt.submittedAt >= (latest.get(id)?.submittedAt ?? 0)) latest.set(id, attempt);
  }
  return [...latest.values()].filter((attempt) => attempt.status === 'error');
}
