import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { Expense, ExpenseDetail, ExpenseInput, ExpenseSummary, ExpenseSummaryRow, ExpenseVisibility } from '@/types/expense';
import { expenseSchema } from '@/lib/validation/expense';

function numeric(value: number | string | null | undefined): number { return Number(value ?? 0); }
function row(value: ExpenseSummaryRow & { paid_amount: number | string; share_amount: number | string; net_amount: number | string; total_amount: number | string }): ExpenseSummaryRow {
  return { user_id: value.user_id, paid_amount: numeric(value.paid_amount), share_amount: numeric(value.share_amount), net_amount: numeric(value.net_amount), total_amount: numeric(value.total_amount) };
}

export function createExpenseApi(client: SupabaseClient<Database>) {
  return {
    async all(visibility: ExpenseVisibility, coupleId: string | null, signal?: AbortSignal): Promise<Expense[]> {
      let query = client.from('expenses').select('*').eq('visibility', visibility).order('expense_date', { ascending: false }).order('created_at', { ascending: false }).limit(100);
      if (visibility === 'shared' && coupleId) query = query.eq('couple_id', coupleId);
      if (signal) query = query.abortSignal(signal);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    async get(id: string, signal?: AbortSignal): Promise<ExpenseDetail | null> {
      let expenseQuery = client.from('expenses').select('*').eq('id', id);
      if (signal) expenseQuery = expenseQuery.abortSignal(signal);
      const { data: expense, error: expenseError } = await expenseQuery.maybeSingle();
      if (expenseError) throw expenseError;
      if (!expense) return null;
      let splitsQuery = client.from('expense_splits').select('*').eq('expense_id', id).order('user_id');
      if (signal) splitsQuery = splitsQuery.abortSignal(signal);
      const { data: splits, error: splitError } = await splitsQuery;
      if (splitError) throw splitError;
      return { ...expense, splits };
    },
    async summary(monthStart: string, visibility: ExpenseVisibility, signal?: AbortSignal): Promise<ExpenseSummary> {
      let query = client.rpc('get_expense_summary', { month_start: monthStart, p_visibility: visibility });
      if (signal) query = query.abortSignal(signal);
      const { data, error } = await query;
      if (error) throw error;
      const members = (data ?? []).map((value) => row(value));
      return { totalAmount: members[0]?.total_amount ?? 0, members };
    },
    async create(input: ExpenseInput): Promise<string> {
      const parsed = expenseSchema.parse(input);
      const { data, error } = await client.rpc('create_expense', {
        p_title: parsed.title, p_amount: parsed.amount, p_currency: parsed.currency, p_category: parsed.category,
        p_expense_date: parsed.expense_date, p_notes: parsed.notes, p_paid_by: parsed.paid_by, p_visibility: parsed.visibility,
        p_splits: parsed.splits,
      });
      if (error) throw error;
      return data;
    },
    async update(id: string, input: ExpenseInput): Promise<string> {
      const parsed = expenseSchema.parse(input);
      const { data, error } = await client.rpc('update_expense', {
        p_expense_id: id, p_title: parsed.title, p_amount: parsed.amount, p_currency: parsed.currency, p_category: parsed.category,
        p_expense_date: parsed.expense_date, p_notes: parsed.notes, p_paid_by: parsed.paid_by, p_visibility: parsed.visibility, p_splits: parsed.splits,
      });
      if (error) throw error;
      return data;
    },
    async remove(id: string): Promise<void> {
      const { error } = await client.rpc('delete_expense', { p_expense_id: id });
      if (error) throw error;
    },
  };
}
