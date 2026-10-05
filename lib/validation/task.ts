import { z } from 'zod';
import { taskCategories, taskPriorities } from '../../types/task.ts';
export const taskReminderOffsets = [0, 5, 10, 15, 30, 60, 1440] as const;
export const taskSchema = z.object({
  title: z.string().trim().min(1, 'What needs doing?').max(160, 'Use 160 characters or fewer.'),
  description: z.string().max(4000, 'Use 4,000 characters or fewer.'),
  due_at: z.string().datetime({ offset: true }).nullable(),
  reminder_offset_minutes: z.union([z.literal(0), z.literal(5), z.literal(10), z.literal(15), z.literal(30), z.literal(60), z.literal(1440)]).nullable(),
  priority: z.enum(taskPriorities), category: z.enum(taskCategories),
  visibility: z.enum(['private', 'shared']),
  couple_id: z.string().uuid().nullable(), assigned_to: z.string().uuid().nullable(),
}).superRefine((value, context) => {
  if (value.visibility === 'shared' && !value.couple_id) context.addIssue({ code: 'custom', path: ['visibility'], message: 'Create a shared space before sharing a task.' });
  if (value.reminder_offset_minutes !== null && !value.due_at) context.addIssue({ code: 'custom', path: ['reminder_offset_minutes'], message: 'Choose a due time before adding an alert.' });
  if (value.visibility === 'private' && value.couple_id) context.addIssue({ code: 'custom', path: ['visibility'], message: 'Private tasks belong to your personal space.' });
});
