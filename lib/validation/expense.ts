import { z } from 'zod';
import { expenseCategories } from '@/types/expense';

export const expenseSchema = z.object({
  couple_id: z.string().uuid().nullable(),
  title: z.string().trim().min(1, 'Add a title').max(160),
  amount: z.number().positive('Enter an amount greater than zero').max(100000000, 'Enter a smaller amount'),
  currency: z.string().regex(/^[A-Z]{3}$/, 'Use a three-letter currency code'),
  category: z.enum(expenseCategories),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a valid date'),
  notes: z.string().max(2000),
  paid_by: z.string().uuid(),
  visibility: z.enum(['private', 'shared']),
  splits: z.array(z.object({ user_id: z.string().uuid(), amount: z.number().nonnegative() })).min(1),
}).superRefine((value, context) => {
  if (value.visibility === 'shared' && !value.couple_id) context.addIssue({ code: z.ZodIssueCode.custom, path: ['couple_id'], message: 'Connect a shared space first' });
  if (value.visibility === 'shared' && value.splits.length < 2) context.addIssue({ code: z.ZodIssueCode.custom, path: ['splits'], message: 'Shared expenses need both members' });
  if (value.visibility === 'private' && value.couple_id) context.addIssue({ code: z.ZodIssueCode.custom, path: ['couple_id'], message: 'Personal expenses cannot belong to a shared space' });
  if (value.visibility === 'private' && value.splits.length !== 1) context.addIssue({ code: z.ZodIssueCode.custom, path: ['splits'], message: 'Personal expenses have one owner' });
});

export const expenseFormSchema = z.object({
  title: z.string().trim().min(1, 'Add a title').max(160),
  amountText: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, 'Enter an amount with up to two decimals'),
  category: z.enum(expenseCategories),
  paid_by: z.string().uuid('Choose who paid'),
  splitMode: z.enum(['equal', 'custom', 'one_payer']),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(2000),
  visibility: z.enum(['private', 'shared']),
});
