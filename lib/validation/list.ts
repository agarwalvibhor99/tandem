import { z } from 'zod';
import { groceryCategories, listTypes } from '../../types/list.ts';

export const listSchema = z.object({
  couple_id: z.string().uuid(),
  name: z.string().trim().min(1, 'Give your list a name.').max(100, 'Use 100 characters or fewer.'),
  type: z.enum(listTypes),
});
export const itemSchema = z.object({
  list_id: z.string().uuid(),
  name: z.string().trim().min(1, 'What do you need?').max(160, 'Use 160 characters or fewer.'),
  quantity: z.string().trim().max(40).nullable(),
  category: z.enum(groceryCategories).nullable(),
  notes: z.string().max(2000),
});
