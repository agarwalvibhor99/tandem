import { createTaskApi } from '@/lib/tasks/api';
import { getSupabaseClient } from '@/lib/supabase/client';
export const getTaskApi = () => createTaskApi(getSupabaseClient());
