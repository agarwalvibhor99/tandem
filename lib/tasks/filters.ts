import { addDays, startOfDay } from 'date-fns';
import type { Task, TaskFilter } from '../../types/task.ts';

export function taskDateBounds(now: Date) {
  return { today: startOfDay(now).toISOString(), tomorrow: startOfDay(addDays(now, 1)).toISOString() };
}
/** Shared by the server query builder and optimistic list projection. */
export function taskMatches(task: Task, filter: TaskFilter, userId: string, tomorrow: string) {
  if (filter === 'Completed') return task.status === 'completed';
  if (task.status !== 'open') return false;
  switch (filter) {
    case 'Today': return !!task.due_at && Date.parse(task.due_at) < Date.parse(tomorrow);
    case 'Upcoming': return !task.due_at || Date.parse(task.due_at) >= Date.parse(tomorrow);
    case 'Mine': return task.visibility === 'private' || task.assigned_to === userId;
    case 'Partner': return task.visibility === 'shared' && !!task.assigned_to && task.assigned_to !== userId;
    case 'Shared': return task.visibility === 'shared';
  }
}
