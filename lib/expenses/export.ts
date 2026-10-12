import { format } from 'date-fns';
import type { Expense, ExpenseVisibility } from '@/types/expense';

export type ExpenseExportRow = Pick<Expense, 'title' | 'amount' | 'currency' | 'category' | 'expense_date' | 'visibility' | 'paid_by' | 'notes' | 'created_at'>;

const headers = ['Title', 'Amount', 'Currency', 'Category', 'Date', 'Visibility', 'Paid by', 'Notes', 'Created at'];

export function escapeCsvValue(value: string | number | null | undefined) {
  const text = value == null ? '' : String(value);
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

export function expensesToCsv(expenses: ExpenseExportRow[], nameFor: (userId: string) => string) {
  const rows = expenses.map((expense) => [
    expense.title,
    Number(expense.amount).toFixed(2),
    expense.currency,
    expense.category,
    expense.expense_date,
    expense.visibility === 'shared' ? 'Couple' : 'Personal',
    nameFor(expense.paid_by),
    expense.notes,
    expense.created_at,
  ]);

  return [headers, ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\n');
}

export function expenseExportFilename(visibility: ExpenseVisibility, date = new Date()) {
  return `tandem-${visibility}-expenses-${format(date, 'yyyy-MM-dd')}.csv`;
}
