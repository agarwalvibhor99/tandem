export function taskErrorMessage(error: unknown) {
  if (error && typeof error === 'object') {
    if ('code' in error && error.code === 'PGRST116') return 'This task changed or is no longer available. Refresh before trying again.';
    if ('code' in error && error.code === '42501') return 'You no longer have permission to change this task. Refresh to see what’s available.';
    if ('message' in error && error.message === 'TASK_INVALID_ASSIGNEE') return 'That person is no longer in your shared space. Choose someone else.';
    if ('message' in error && error.message === 'TASK_CREATOR_ONLY') return 'Only the person who created this task can change who can see it.';
  }
  return 'We couldn’t save your change. Check your connection and try again.';
}
