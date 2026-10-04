export function reminderErrorMessage(error: unknown) {
  const message = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : '';
  if (message.includes('REMINDER_MEMBERSHIP_REQUIRED')) return 'Connect to your shared space before sharing a reminder.';
  if (message.includes('REMINDER_INVALID_ASSIGNEE')) return 'Only someone in your shared space can be assigned.';
  if (message.includes('REMINDER_CREATOR_ONLY')) return 'Only the reminder creator can change its privacy scope.';
  if (message.includes('REMINDER_IDENTITY_IMMUTABLE')) return 'This reminder changed in another session. Refresh and try again.';
  if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST116') return 'This reminder changed or is no longer available.';
  if (error && typeof error === 'object' && 'code' in error && error.code === '42501') return 'You no longer have access to this reminder.';
  return 'We couldn’t save this reminder. Check your connection and try again.';
}
