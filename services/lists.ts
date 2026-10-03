import { createListApi } from '@/lib/lists/api';
import { getSupabaseClient } from '@/lib/supabase/client';
export const getListApi = () => createListApi(getSupabaseClient());
