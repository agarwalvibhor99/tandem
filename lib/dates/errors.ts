export function dateIdeaErrorMessage(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
  if (code === 'PGRST116') return 'This idea changed elsewhere. Refresh it and try again.';
  if (code === '42501') return 'You no longer have access to this shared space.';
  return 'We couldn’t save this idea. Check your connection and try again.';
}
