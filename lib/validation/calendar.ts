import { z } from 'zod';
export const calendarReminderOffsets = [0, 5, 10, 15, 30, 60, 1440] as const;
export function createCalendarEventSchema(now: Date | number = Date.now()) {
  const nowMs = typeof now === 'number' ? now : now.getTime();
  return z.object({
  couple_id: z.string().uuid().nullable(),
  title: z.string().trim().min(1, 'What’s happening?').max(160, 'Use 160 characters or fewer.'),
  start_at: z.string().datetime({ offset: true }),
  end_at: z.string().datetime({ offset: true }),
  visibility: z.enum(['private', 'shared']),
  location: z.string().max(300),
  notes: z.string().max(4000),
  reminder_offset_minutes: z.union([z.literal(0), z.literal(5), z.literal(10), z.literal(15), z.literal(30), z.literal(60), z.literal(1440)]).nullable(),
}).superRefine((value, context) => {
  const start = Date.parse(value.start_at);
  if (Number.isFinite(start) && start < nowMs) context.addIssue({ code: 'custom', path: ['start_at'], message: 'Event time can’t be before now.' });
  if (Date.parse(value.end_at) <= start) context.addIssue({ code: 'custom', path: ['end_at'], message: 'End time must be after start time.' });
  if (value.visibility === 'private' && value.couple_id) context.addIssue({ code: 'custom', path: ['visibility'], message: 'Private events belong to you.' });
  if (value.visibility === 'shared' && !value.couple_id) context.addIssue({ code: 'custom', path: ['visibility'], message: 'Create a shared space before sharing an event.' });
});
}
export const calendarEventSchema = createCalendarEventSchema();
