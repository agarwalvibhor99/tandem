import { createReminderApi } from '@/lib/reminders/api';
import { getSupabaseClient } from '@/lib/supabase/client';
export const getReminderApi = () => createReminderApi(getSupabaseClient());
