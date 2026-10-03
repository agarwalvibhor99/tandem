import { createCalendarApi } from '@/lib/calendar/api';
import { getSupabaseClient } from '@/lib/supabase/client';
export const getCalendarApi = () => createCalendarApi(getSupabaseClient());
