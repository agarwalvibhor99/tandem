export function calendarErrorMessage(error: unknown) {
  if (error && typeof error === 'object') {
    if ('code' in error && error.code === 'PGRST116') return 'This event changed or is no longer available. Refresh and try again.';
    if ('code' in error && error.code === '42501') return 'You no longer have permission to change this event.';
    if ('message' in error && error.message === 'CALENDAR_MEMBERSHIP_REQUIRED') return 'Connect to a shared space before adding a shared event.';
  }
  return 'We couldn’t save this event. Check your connection and try again.';
}
