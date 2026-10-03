export function authErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
  const status = typeof error === 'object' && error !== null && 'status' in error ? error.status : undefined;
  switch (code) {
    case 'invalid_credentials': return 'That email and password don’t match. Please try again.';
    case 'email_not_confirmed': return 'Please confirm your email first, then come back to log in.';
    case 'user_already_exists':
    case 'email_exists': return 'Unable to create an account with these details. Try logging in instead.';
    case 'weak_password': return 'Choose a stronger password with at least 12 characters.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit': return 'Too many attempts. Please wait a few minutes and try again.';
    case 'signup_disabled': return 'New accounts aren’t available right now. Please try again later.';
    case 'session_not_found':
    case 'refresh_token_not_found':
    case 'refresh_token_already_used': return 'Your session has expired. Please log in again.';
  }
  if (status === 429) return 'Too many attempts. Please wait a few minutes and try again.';
  if (error instanceof TypeError || status === 0) return 'We couldn’t connect. Check your internet connection and try again.';
  return 'Something went wrong. Please try again in a moment.';
}
