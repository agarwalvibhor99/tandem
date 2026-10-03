export function listErrorMessage(error: unknown) {
  if (error && typeof error === 'object') {
    if ('code' in error && error.code === 'PGRST116') return 'This item changed or is no longer available. Refresh and try again.';
    if ('code' in error && error.code === '42501') return 'You no longer have access to this list. Refresh to see what’s available.';
    if ('message' in error && error.message === 'CATEGORY_ONLY_FOR_GROCERIES') return 'Categories are only available for groceries.';
  }
  return 'We couldn’t save your change. Check your connection and try again.';
}
