export type CentSplit = { userId: string; amountCents: number };
export type Balance = { debtorId: string; creditorId: string; amountCents: number } | null;

export function toCents(amount: number | string): number {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(value) || value < 0) throw new Error('Amount must be a non-negative number');
  return Math.round((value + Number.EPSILON) * 100);
}

export function fromCents(cents: number): number {
  if (!Number.isInteger(cents) || cents < 0) throw new Error('Cents must be a non-negative integer');
  return cents / 100;
}

export function calculateEqualSplit(totalCents: number, userIds: string[]): CentSplit[] {
  if (!Number.isInteger(totalCents) || totalCents < 0 || userIds.length < 1) throw new Error('Invalid equal split');
  const base = Math.floor(totalCents / userIds.length);
  const remainder = totalCents % userIds.length;
  return userIds.map((userId, index) => ({ userId, amountCents: base + (index < remainder ? 1 : 0) }));
}

export function calculateCustomSplit(totalCents: number, splits: CentSplit[]): CentSplit[] {
  if (!Number.isInteger(totalCents) || totalCents <= 0 || splits.length < 1 || splits.some(({ amountCents }) => !Number.isInteger(amountCents) || amountCents < 0)) {
    throw new Error('Invalid custom split');
  }
  if (splits.reduce((sum, split) => sum + split.amountCents, 0) !== totalCents) throw new Error('Split amounts must equal the total');
  return splits;
}

/** Assigns the whole share to one selected member and keeps zero rows for the other members. */
export function calculateOnePayerSplit(totalCents: number, payerId: string, userIds: string[]): CentSplit[] {
  if (!Number.isInteger(totalCents) || totalCents <= 0 || !userIds.includes(payerId)) throw new Error('Invalid one-person split');
  return userIds.map((userId) => ({ userId, amountCents: userId === payerId ? totalCents : 0 }));
}

export function userNetPositions(expenses: Array<{ paidBy: string; amountCents: number; splits: CentSplit[] }>): Map<string, number> {
  const positions = new Map<string, number>();
  const add = (userId: string, amount: number) => positions.set(userId, (positions.get(userId) ?? 0) + amount);
  for (const expense of expenses) {
    add(expense.paidBy, expense.amountCents);
    for (const split of expense.splits) add(split.userId, -split.amountCents);
  }
  return positions;
}

export function calculateCoupleBalance(positions: Map<string, number>): Balance {
  const creditor = [...positions.entries()].filter(([, amount]) => amount > 0).sort((a, b) => b[1] - a[1])[0];
  const debtor = [...positions.entries()].filter(([, amount]) => amount < 0).sort((a, b) => a[1] - b[1])[0];
  if (!creditor || !debtor) return null;
  const amountCents = Math.min(creditor[1], Math.abs(debtor[1]));
  return amountCents > 0 ? { debtorId: debtor[0], creditorId: creditor[0], amountCents } : null;
}

export function calculateExpenseSplits(totalCents: number, userIds: string[], mode: 'equal' | 'one_payer', custom?: CentSplit[], payerId?: string): CentSplit[] {
  if (mode === 'equal') return calculateEqualSplit(totalCents, userIds);
  if (mode === 'one_payer') return calculateOnePayerSplit(totalCents, payerId ?? '', userIds);
  return calculateCustomSplit(totalCents, custom ?? []);
}
