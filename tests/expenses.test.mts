import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCoupleBalance, calculateCustomSplit, calculateEqualSplit, calculateOnePayerSplit, toCents, userNetPositions } from '../lib/expenses/calculations.ts';
import { filterExpenses } from '../lib/expenses/filters.ts';

test('splits an odd cent deterministically while preserving the total', () => {
  assert.deepEqual(calculateEqualSplit(101, ['alex', 'sam']), [{ userId: 'alex', amountCents: 51 }, { userId: 'sam', amountCents: 50 }]);
});

test('custom splits reject amounts that do not add up', () => {
  assert.throws(() => calculateCustomSplit(1000, [{ userId: 'alex', amountCents: 400 }, { userId: 'sam', amountCents: 500 }]), /equal/);
});

test('the example produces a 100 dollar balance', () => {
  const positions = userNetPositions([
    { paidBy: 'alex', amountCents: 50000, splits: [{ userId: 'alex', amountCents: 25000 }, { userId: 'sam', amountCents: 25000 }] },
    { paidBy: 'sam', amountCents: 30000, splits: [{ userId: 'alex', amountCents: 15000 }, { userId: 'sam', amountCents: 15000 }] },
  ]);
  assert.deepEqual(calculateCoupleBalance(positions), { debtorId: 'sam', creditorId: 'alex', amountCents: 10000 });
});

test('money input converts to exact cents', () => {
  assert.equal(toCents('12.35'), 1235);
  assert.throws(() => toCents('-1'), /non-negative/);
});

test('one-person splits assign the full share to the selected member', () => {
  assert.deepEqual(calculateOnePayerSplit(1200, 'alex', ['alex', 'sam']), [{ userId: 'alex', amountCents: 1200 }, { userId: 'sam', amountCents: 0 }]);
});

test('expense search matches title case-insensitively and combines with category', () => {
  const expenses = [
    { title: 'Weekly groceries', category: 'Groceries' as const },
    { title: 'Dinner at Juniper', category: 'Dining' as const },
    { title: 'Groceries for dinner', category: 'Groceries' as const },
  ];

  assert.deepEqual(filterExpenses(expenses, 'DINNER', 'all'), [expenses[1], expenses[2]]);
  assert.deepEqual(filterExpenses(expenses, 'groceries', 'Groceries'), [expenses[0], expenses[2]]);
  assert.deepEqual(filterExpenses(expenses, '', 'Dining'), [expenses[1]]);
});
