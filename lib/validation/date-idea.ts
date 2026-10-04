import { z } from 'zod';
import { dateCategories, dateStatuses } from '@/types/date-idea';

const costLevelSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);

export const dateIdeaSchema = z.object({
  couple_id: z.string().uuid(),
  title: z.string().trim().min(1, 'Add a name for this idea.').max(160, 'Use 160 characters or fewer.'),
  category: z.enum(dateCategories),
  cost_level: costLevelSchema,
  duration_minutes: z.number().int().min(30, 'Choose at least 30 minutes.').max(1440, 'Choose one day or less.'),
  location: z.string().trim().max(300, 'Use 300 characters or fewer.'),
  notes: z.string().trim().max(2000, 'Use 2,000 characters or fewer.'),
  status: z.enum(dateStatuses),
});

export const datePlanSchema = z.object({
  start_at: z.string().datetime({ offset: true }),
  end_at: z.string().datetime({ offset: true }),
  budget: costLevelSchema,
  category: z.enum(['any', ...dateCategories]),
  mood: z.enum(['any', 'relaxed', 'active', 'explore']),
}).refine((value) => Date.parse(value.end_at) > Date.parse(value.start_at), {
  path: ['end_at'], message: 'Choose an end time after the start.',
});
