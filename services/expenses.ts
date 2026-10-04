import { createExpenseApi } from '@/lib/expenses/api';
import { getSupabaseClient } from '@/lib/supabase/client';
export const getExpenseApi = () => createExpenseApi(getSupabaseClient());
