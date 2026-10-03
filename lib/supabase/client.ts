import 'react-native-url-polyfill/auto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseEnvironment } from '@/lib/environment';
import { sessionStorage } from '@/lib/supabase/session-storage';
import type { Database } from '@/types/database';

let client: SupabaseClient<Database> | undefined;

/** Initialized by the auth provider after mount, never during web rendering. */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (client) return client;

  const environment = getSupabaseEnvironment();
  if (!environment) {
    throw new Error('Supabase is not configured. Add the public values from .env.example to .env.local.');
  }

  client = createClient<Database>(environment.url, environment.publishableKey, {
    auth: {
      storage: sessionStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      // Confirmation happens in the email link; users then log in explicitly.
      // PKCE prevents confirmation redirects from placing bearer tokens in URLs.
      flowType: 'pkce',
    },
  });

  return client;
}
