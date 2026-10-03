import { parseSupabaseEnvironment } from '@/lib/validation/environment';

export function getSupabaseEnvironment() {
  // Expo requires static dot notation to inline public environment variables.
  return parseSupabaseEnvironment({
    url: process.env.EXPO_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}
