import { createPartnerNudgeApi } from '@/lib/nudges/api';
import { getSupabaseClient } from '@/lib/supabase/client';

export const getPartnerNudgeApi = () => createPartnerNudgeApi(getSupabaseClient());
