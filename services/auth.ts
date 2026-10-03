import type { SupabaseClient } from '@supabase/supabase-js';

import type { LoginValues, SignUpValues } from '../lib/validation/auth.ts';
import type { Database } from '../types/database.ts';

export function createAuthService(client: SupabaseClient<Database>) {
  return {
    async login(values: LoginValues) {
      const { error } = await client.auth.signInWithPassword(values);
      if (error) throw error;
    },
    async signUp({ name, email, password }: SignUpValues): Promise<'signedIn' | 'confirmEmail'> {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: { data: { name, timezone } },
      });
      if (error) throw error;
      // The profile is created by the database trigger, not a second client write.
      return data.session ? 'signedIn' : 'confirmEmail';
    },
    async logout() {
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) throw error;
    },
  };
}
