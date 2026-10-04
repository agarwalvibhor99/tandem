import { endOfMonth, endOfQuarter, endOfWeek, isWithinInterval, parseISO, startOfMonth, startOfQuarter, startOfWeek } from 'date-fns';
export const expenseAnalyticsCategories = ['Groceries', 'Dining', 'Household', 'Travel', 'Entertainment', 'Transportation', 'Utilities', 'Shopping', 'Other'] as const;
export type ExpenseCategory = (typeof expenseAnalyticsCategories)[number];
export type ExpenseForAnalytics = { amount: number; category: ExpenseCategory; paid_by: string; expense_date: string };
export type ExpensePeriod = 'week' | 'month' | 'quarter';
export type CostTier = 'small' | 'medium' | 'large';
export type CategorySpend = { category: ExpenseCategory; amount: number; count: number; percentage: number };
export type PayerSpend = { userId: string; amount: number; count: number };

export function periodLabel(period: ExpensePeriod) {
  if (period === 'week') return 'This week';
  if (period === 'quarter') return 'This quarter';
  return 'This month';
}

export function periodInterval(period: ExpensePeriod, now = new Date()) {
  if (period === 'week') return { start: startOfWeek(now), end: endOfWeek(now) };
  if (period === 'quarter') return { start: startOfQuarter(now), end: endOfQuarter(now) };
  return { start: startOfMonth(now), end: endOfMonth(now) };
}

export function expensesInPeriod<T extends ExpenseForAnalytics>(expenses: T[], period: ExpensePeriod, now = new Date()) {
  const interval = periodInterval(period, now);
  return expenses.filter((expense) => isWithinInterval(parseISO(expense.expense_date), interval));
}

export function expenseTotal(expenses: ExpenseForAnalytics[]) {
  return expenses.reduce((total, expense) => total + Number(expense.amount), 0);
}

export function categoryBreakdown(expenses: ExpenseForAnalytics[]): CategorySpend[] {
  const total = expenseTotal(expenses);
  const byCategory = new Map<ExpenseCategory, { amount: number; count: number }>();
  for (const category of expenseAnalyticsCategories) byCategory.set(category, { amount: 0, count: 0 });
  for (const expense of expenses) {
    const current = byCategory.get(expense.category) ?? { amount: 0, count: 0 };
    byCategory.set(expense.category, { amount: current.amount + Number(expense.amount), count: current.count + 1 });
  }
  return [...byCategory.entries()]
    .map(([category, value]) => ({ category, amount: value.amount, count: value.count, percentage: total > 0 ? value.amount / total : 0 }))
    .filter((entry) => entry.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

export function payerBreakdown(expenses: ExpenseForAnalytics[]): PayerSpend[] {
  const byPayer = new Map<string, { amount: number; count: number }>();
  for (const expense of expenses) {
    const current = byPayer.get(expense.paid_by) ?? { amount: 0, count: 0 };
    byPayer.set(expense.paid_by, { amount: current.amount + Number(expense.amount), count: current.count + 1 });
  }
  return [...byPayer.entries()].map(([userId, value]) => ({ userId, amount: value.amount, count: value.count })).sort((a, b) => b.amount - a.amount);
}

export function costTier(amount: number): CostTier {
  if (amount >= 150) return 'large';
  if (amount >= 50) return 'medium';
  return 'small';
}
