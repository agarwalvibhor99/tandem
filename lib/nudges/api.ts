import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { PartnerNudge, PartnerNudgeType } from '@/types/nudge';

export function createPartnerNudgeApi(client: SupabaseClient<Database>) {
  return {
    async recent(coupleId: string, signal?: AbortSignal): Promise<PartnerNudge[]> {
      let query = client.from('partner_nudges').select('*').eq('couple_id', coupleId).eq('status', 'visible').order('created_at', { ascending: false }).limit(20);
      if (signal) query = query.abortSignal(signal);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    async send(coupleId: string, type: PartnerNudgeType): Promise<PartnerNudge> {
      const { data, error } = await client.from('partner_nudges').insert({ couple_id: coupleId, type }).select('*').single();
      if (error) throw error;
      return data;
    },
    async setStatus(id: string, status: PartnerNudge['status']): Promise<PartnerNudge> {
      const { data, error } = await client.from('partner_nudges').update({ status }).eq('id', id).select('*').single();
      if (error) throw error;
      return data;
    },
  };
}
