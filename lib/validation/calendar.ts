import { z } from 'zod';
export const calendarEventSchema = z.object({
  couple_id: z.string().uuid().nullable(),
  title: z.string().trim().min(1, 'What’s happening?').max(160, 'Use 160 characters or fewer.'),
  start_at: z.string().datetime({ offset: true }),
  end_at: z.string().datetime({ offset: true }),
  visibility: z.enum(['private', 'shared']),
  location: z.string().max(300),
  notes: z.string().max(4000),
}).superRefine((value, context) => {
  if (Date.parse(value.end_at) <= Date.parse(value.start_at)) context.addIssue({ code: 'custom', path: ['end_at'], message: 'End time must be after start time.' });
  if (value.visibility === 'private' && value.couple_id) context.addIssue({ code: 'custom', path: ['visibility'], message: 'Private events belong to you.' });
  if (value.visibility === 'shared' && !value.couple_id) context.addIssue({ code: 'custom', path: ['visibility'], message: 'Create a shared space before sharing an event.' });
});
