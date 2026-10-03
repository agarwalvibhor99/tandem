import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { AppState, Platform } from 'react-native';

import { createSessionManager, type AuthState } from '@/lib/auth/session-manager';
import { consumeConfirmationReturn } from '@/lib/auth/confirmation-return';
import { getSupabaseEnvironment } from '@/lib/environment';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { LoginValues, SignUpValues } from '@/lib/validation/auth';
import { createAuthService } from '@/services/auth';

type State = AuthState | { status: 'unconfigured'; session: null };
type AuthContextValue = State & {
  notice: string | null;
  login(values: LoginValues): Promise<void>;
  signUp(values: SignUpValues): Promise<'signedIn' | 'confirmEmail'>;
  logout(): Promise<void>;
  retry(): void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<State>({ status: 'restoring', session: null });
  const [attempt, setAttempt] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const runtime = useRef<{
    service: ReturnType<typeof createAuthService>;
    manager: ReturnType<typeof createSessionManager>;
  } | null>(null);

  useEffect(() => {
    const confirmationNotice = consumeConfirmationReturn();
    if (confirmationNotice) setNotice(confirmationNotice);
    setState({ status: 'restoring', session: null });
    let client: ReturnType<typeof getSupabaseClient>;
    try {
      if (!getSupabaseEnvironment()) {
        setState({ status: 'unconfigured', session: null });
        return;
      }
      client = getSupabaseClient();
    } catch {
      setState({ status: 'unconfigured', session: null });
      return;
    }

    const manager = createSessionManager(client.auth, () => queryClient.clear());
    runtime.current = { service: createAuthService(client), manager };
    const unsubscribe = manager.subscribe(() => setState(manager.getSnapshot()));
    const stop = manager.start();

    function updateRefresh(appState: string) {
      if (appState === 'active') void client.auth.startAutoRefresh();
      else void client.auth.stopAutoRefresh();
    }
    const lifecycle = Platform.OS !== 'web'
      ? AppState.addEventListener('change', updateRefresh)
      : null;
    if (Platform.OS !== 'web') updateRefresh(AppState.currentState);

    return () => {
      stop();
      unsubscribe();
      lifecycle?.remove();
      if (Platform.OS !== 'web') void client.auth.stopAutoRefresh();
      runtime.current = null;
    };
  }, [attempt, queryClient]);

  const login = useCallback(async (values: LoginValues) => {
    if (!runtime.current) throw new Error('Authentication is unavailable.');
    setNotice(null);
    await runtime.current.service.login(values);
  }, []);

  const signUp = useCallback(async (values: SignUpValues) => {
    if (!runtime.current) throw new Error('Authentication is unavailable.');
    setNotice(null);
    return runtime.current.service.signUp(values);
  }, []);

  const logout = useCallback(async () => {
    if (!runtime.current) return;
    try {
      await runtime.current.service.logout();
    } catch (error) {
      // Supabase may clear local storage even if remote revocation fails.
      if (runtime.current.manager.getSnapshot().status === 'signedOut') {
        setNotice('You’re logged out on this device. We couldn’t confirm sign-out with the server.');
        return;
      }
      throw error;
    }
  }, []);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  const value = useMemo(() => ({ ...state, notice, login, signUp, logout, retry }), [state, notice, login, signUp, logout, retry]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
