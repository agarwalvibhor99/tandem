const messages: Record<string, string> = {
  INVALID_INVITE: 'We couldn’t find that invitation. Check the code with your partner.',
  INVITE_EXPIRED: 'This invitation has expired. Ask your partner for a new code.',
  INVITE_USED: 'This invitation has already been used. Ask your partner to check their space.',
  ALREADY_CONNECTED: 'You already belong to a shared space. You can’t join another one yet.',
  SELF_INVITE: 'This is your own invitation. Share it with your partner so they can join.',
  COUPLE_FULL: 'This space already has two members.',
  NO_COUPLE: 'Create a shared space before inviting your partner.',
  AUTH_REQUIRED: 'Please log in again to continue.',
  INVALID_SPACE_NAME: 'Give your space a name between 1 and 80 characters.',
};
export function coupleErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    const message = messages[error.message];
    if (message) return message;
  }
  return 'We couldn’t connect right now. Check your connection and try again.';
}
