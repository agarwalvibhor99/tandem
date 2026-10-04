import assert from 'node:assert/strict';
import { test } from 'node:test';
import { categoryBreakdown, costTier, expensesInPeriod, expenseTotal, payerBreakdown } from '../lib/expenses/analytics.ts';
import type { Expense } from '../types/expense.ts';

const base = { id: '1', couple_id: 'c1', created_by: 'u1', paid_by: 'u1', title: 'Groceries', currency: 'USD', notes: '', created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z', visibility: 'shared' as const };
const expenses: Expense[] = [
  { ...base, id: '1', paid_by: 'u1', amount: 80, category: 'Groceries', expense_date: '2026-10-02' },
  { ...base, id: '2', paid_by: 'u2', amount: 40, category: 'Dining', expense_date: '2026-10-03' },
  { ...base, id: '3', paid_by: 'u1', amount: 200, category: 'Travel', expense_date: '2026-07-03' },
];

test('filters expenses by week and month', () => {
  const now = new Date('2026-10-03T12:00:00Z');
  assert.equal(expensesInPeriod(expenses, 'week', now).length, 2);
  assert.equal(expensesInPeriod(expenses, 'month', now).length, 2);
  assert.equal(expensesInPeriod(expenses, 'quarter', now).length, 2);
});

test('summarizes category and payer spending', () => {
  const current = expenses.slice(0, 2);
  assert.equal(expenseTotal(current), 120);
  assert.deepEqual(categoryBreakdown(current).map((entry) => [entry.category, entry.amount]), [['Groceries', 80], ['Dining', 40]]);
  assert.deepEqual(payerBreakdown(current).map((entry) => [entry.userId, entry.amount]), [['u1', 80], ['u2', 40]]);
});

test('assigns calm cost tiers', () => {
  assert.equal(costTier(12), 'small');
  assert.equal(costTier(50), 'medium');
  assert.equal(costTier(150), 'large');
});
