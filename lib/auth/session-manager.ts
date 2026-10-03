import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

export type AuthState =
  | { status: 'restoring'; session: null }
  | { status: 'signedOut'; session: null }
  | { status: 'signedIn'; session: Session }
  | { status: 'error'; session: null };

export interface SessionSource {
  getSession(): Promise<{ data: { session: Session | null }; error: unknown }>;
  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void): {
    data: { subscription: { unsubscribe(): void } };
  };
}

/** Owns restore/event ordering. Kept independent of React so races are testable. */
export function createSessionManager(auth: SessionSource, clearPrivateCache: () => void) {
  let state: AuthState = { status: 'restoring', session: null };
  let revision = 0;
  let active = false;
  const listeners = new Set<() => void>();

  function publish(next: AuthState) {
    if (state.session?.user.id !== next.session?.user.id) clearPrivateCache();
    state = next;
    listeners.forEach((listener) => listener());
  }

  function accept(session: Session | null) {
    publish(session ? { status: 'signedIn', session } : { status: 'signedOut', session: null });
  }

  async function restore() {
    const attempt = ++revision;
    publish({ status: 'restoring', session: null });
    try {
      const { data, error } = await auth.getSession();
      if (!active || attempt !== revision) return;
      if (error) throw error;
      accept(data.session);
    } catch {
      if (active && attempt === revision) publish({ status: 'error', session: null });
    }
  }

  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    restore,
    start() {
      active = true;
      const { data } = auth.onAuthStateChange((event, session) => {
        // getSession owns startup errors; INITIAL_SESSION can hide storage errors.
        if (!active || event === 'INITIAL_SESSION') return;
        revision++;
        accept(session);
      });
      void restore();
      return () => {
        active = false;
        revision++;
        data.subscription.unsubscribe();
      };
    },
  };
}
