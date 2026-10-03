import { getSupabaseClient } from '@/lib/supabase/client';
import { createCoupleSchema, joinCoupleSchema } from '@/lib/validation/couple';

export async function createCouple(name: string) {
  const parsed = createCoupleSchema.parse({ name });
  const { data, error } = await getSupabaseClient().rpc('create_couple', { space_name: parsed.name });
  if (error) throw error;
  return data;
}
export async function generateCoupleInvite() {
  const { data, error } = await getSupabaseClient().rpc('generate_couple_invite');
  if (error) throw error;
  return data;
}
export async function acceptCoupleInvite(code: string) {
  const parsed = joinCoupleSchema.parse({ code });
  const { data, error } = await getSupabaseClient().rpc('accept_couple_invite', { code: parsed.code });
  if (error) throw error;
  return data;
}
