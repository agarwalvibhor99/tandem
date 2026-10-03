import { z } from 'zod';

const supabaseEnvironmentSchema = z.object({
  url: z.string().url().refine((value) => {
    try {
      const url = new URL(value);
      const isLoopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
      return url.protocol === 'https:' || (url.protocol === 'http:' && isLoopback);
    } catch {
      // Zod refinements can run even when the preceding URL check fails.
      return false;
    }
  }),
  // Accept only public publishable keys, never secret keys or service-role JWTs.
  publishableKey: z.string().regex(/^sb_publishable_[A-Za-z0-9_-]+$/),
});

export type SupabaseEnvironment = z.infer<typeof supabaseEnvironmentSchema>;

export function parseSupabaseEnvironment(input: {
  url?: string;
  publishableKey?: string;
}): SupabaseEnvironment | null {
  const url = input.url?.trim() || undefined;
  const publishableKey = input.publishableKey?.trim() || undefined;

  // Missing configuration allows the auth UI to render with submission disabled.
  if (!url && !publishableKey) return null;

  const result = supabaseEnvironmentSchema.safeParse({ url, publishableKey });
  if (!result.success) {
    // Do not expose environment values in error messages or logs.
    throw new Error(
      'Invalid Supabase configuration. Set EXPO_PUBLIC_SUPABASE_URL to an HTTPS URL ' +
      '(HTTP is allowed for loopback development) and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ' +
      'to a public sb_publishable_ key. See .env.example.',
    );
  }

  return result.data;
}
