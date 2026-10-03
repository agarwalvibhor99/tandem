import { z } from 'zod';
import { taskCategories, taskPriorities } from '../../types/task.ts';
export const taskSchema = z.object({
  title: z.string().trim().min(1, 'What needs doing?').max(160, 'Use 160 characters or fewer.'),
  description: z.string().max(4000, 'Use 4,000 characters or fewer.'),
  due_at: z.string().datetime({ offset: true }).nullable(),
  priority: z.enum(taskPriorities), category: z.enum(taskCategories),
  visibility: z.enum(['private', 'shared']),
  couple_id: z.string().uuid().nullable(), assigned_to: z.string().uuid().nullable(),
}).superRefine((value, context) => {
  if (value.visibility === 'shared' && !value.couple_id) context.addIssue({ code: 'custom', path: ['visibility'], message: 'Create a shared space before sharing a task.' });
  if (value.visibility === 'private' && value.couple_id) context.addIssue({ code: 'custom', path: ['visibility'], message: 'Private tasks belong to your personal space.' });
});
