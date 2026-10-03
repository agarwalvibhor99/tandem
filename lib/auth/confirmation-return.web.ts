/** Remove one-time auth parameters from browser history; never log their values. */
export function consumeConfirmationReturn(): string | null {
  const url = new URL(window.location.href);
  const fragment = new URLSearchParams(url.hash.slice(1));
  const failed = url.searchParams.has('error') || fragment.has('error');
  const hasAuthReturn = failed || url.searchParams.has('code') || fragment.has('access_token');
  if (!hasAuthReturn) return null;
  for (const key of ['code', 'error', 'error_code', 'error_description']) url.searchParams.delete(key);
  url.hash = '';
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`);
  return failed
    ? 'That confirmation link is invalid or expired. If you already confirmed your email, you can log in.'
    : 'Your email link has been opened. Log in to continue.';
}
