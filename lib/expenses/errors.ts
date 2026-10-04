export function expenseErrorMessage(error: unknown) {
  const message = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : '';
  if (message.includes('COUPLE_REQUIRED')) return 'Connect to your shared space before adding an expense.';
  if (message.includes('EXPENSE_PRIVATE_OWNER_REQUIRED')) return 'Personal expenses belong to you only.';
  if (message.includes('INVALID_EXPENSE_VISIBILITY')) return 'Choose whether this expense is personal or shared.';
  if (message.includes('EXPENSE_SPLITS_MUST_MATCH_MEMBERS')) return 'Shared expenses need both couple members in the split.';
  if (message.includes('EXPENSE_NOT_FOUND')) return 'That expense is no longer available.';
  if (message.includes('EXPENSE_SPLITS_MUST_MATCH_TOTAL')) return 'The split amounts must add up to the total.';
  if (message.includes('EXPENSE_MEMBER_REQUIRED') || message.includes('EXPENSE_SPLIT_MEMBER_REQUIRED')) return 'Only members of your shared space can be included.';
  if (message.includes('INVALID_EXPENSE_')) return 'Check the expense details and try again.';
  if (error && typeof error === 'object' && 'code' in error && error.code === '42501') return 'You no longer have access to this shared space.';
  return 'We couldn’t save this expense. Check your connection and try again.';
}
