import type { ExpenseCategory } from '@/types/expense';

export type ExpenseSearchable = {
  title: string;
  category: ExpenseCategory;
};

export function filterExpenses<T extends ExpenseSearchable>(expenses: T[], name: string, category: ExpenseCategory | 'all') {
  const normalizedName = name.trim().toLocaleLowerCase();
  return expenses.filter((expense) => (category === 'all' || expense.category === category)
    && (!normalizedName || expense.title.toLocaleLowerCase().includes(normalizedName)));
}
