import { createDateIdeaApi } from '@/lib/dates/api';
import { getSupabaseClient } from '@/lib/supabase/client';
export const getDateIdeaApi = () => createDateIdeaApi(getSupabaseClient());
