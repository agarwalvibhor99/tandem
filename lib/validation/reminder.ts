import { z } from 'zod';
import { reminderRecurrences } from '@/types/reminder';

export const reminderSchema = z.object({
  couple_id: z.string().uuid().nullable(),
  assigned_to: z.string().uuid().nullable(),
  title: z.string().trim().min(1, 'Add a title').max(160, 'Use 160 characters or fewer.'),
  notes: z.string().max(2000, 'Use 2,000 characters or fewer.'),
  remind_at: z.string().datetime({ offset: true }),
  visibility: z.enum(['private', 'shared']),
  recurrence: z.enum(reminderRecurrences),
}).superRefine((value, context) => {
  if (value.visibility === 'private' && value.couple_id) context.addIssue({ code: z.ZodIssueCode.custom, path: ['visibility'], message: 'Private reminders belong to your personal space.' });
  if (value.visibility === 'private' && value.assigned_to) context.addIssue({ code: z.ZodIssueCode.custom, path: ['assigned_to'], message: 'Private reminders cannot be assigned to a partner.' });
  if (value.visibility === 'shared' && !value.couple_id) context.addIssue({ code: z.ZodIssueCode.custom, path: ['visibility'], message: 'Create a shared space before sharing a reminder.' });
});
