export const taskCategories = ['Home', 'Errands', 'Bills', 'Shopping', 'Planning', 'Personal', 'Other'] as const;
export const taskPriorities = ['low', 'normal', 'high'] as const;
export const taskFilters = ['Today', 'Upcoming', 'Mine', 'Partner', 'Shared', 'Completed'] as const;
export type TaskFilter = typeof taskFilters[number];
export type Task = {
  id: string; couple_id: string | null; created_by: string; assigned_to: string | null;
  title: string; description: string; due_at: string | null;
  status: 'open' | 'completed'; priority: typeof taskPriorities[number];
  category: typeof taskCategories[number]; visibility: 'private' | 'shared';
  created_at: string; updated_at: string; completed_at: string | null;
};
export type TaskInput = Pick<Task, 'title' | 'description' | 'due_at' | 'priority' | 'category' | 'visibility' | 'couple_id' | 'assigned_to'>;
