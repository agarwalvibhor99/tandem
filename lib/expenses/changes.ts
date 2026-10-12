import type { Expense } from '@/types/expense';

export function expenseIdSet(expenses: Pick<Expense, 'id'>[]) {
  return new Set(expenses.map((expense) => expense.id));
}

export function newPartnerExpenses<T extends Pick<Expense, 'id' | 'created_by'>>(latest: T[], knownIds: Set<string> | null, currentUserId: string) {
  if (!knownIds) return [];
  return latest.filter((expense) => !knownIds.has(expense.id) && expense.created_by !== currentUserId);
}
