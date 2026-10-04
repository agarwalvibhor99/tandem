export const expenseCategories = [
  'Groceries',
  'Dining',
  'Household',
  'Travel',
  'Entertainment',
  'Transportation',
  'Utilities',
  'Shopping',
  'Other',
] as const;

export type ExpenseCategory = (typeof expenseCategories)[number];
export type ExpenseSplitMode = 'equal' | 'custom' | 'one_payer';
export type ExpenseVisibility = 'private' | 'shared';

export type Expense = {
  id: string;
  couple_id: string | null;
  created_by: string;
  paid_by: string;
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  expense_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
  visibility: ExpenseVisibility;
};

export type ExpenseSplit = {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
};

export type ExpenseInput = Omit<Expense, 'id' | 'created_by' | 'created_at' | 'updated_at'> & {
  splits: ExpenseSplitInput[];
};

export type ExpenseSplitInput = { user_id: string; amount: number };

export type ExpenseDetail = Expense & { splits: ExpenseSplit[] };

export type ExpenseSummaryRow = {
  user_id: string;
  paid_amount: number;
  share_amount: number;
  net_amount: number;
  total_amount: number;
};

export type ExpenseSummary = {
  totalAmount: number;
  members: ExpenseSummaryRow[];
};
