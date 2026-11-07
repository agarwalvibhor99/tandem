export const partnerNudgeTypes = ['rose', 'heart', 'coffee'] as const;
export type PartnerNudgeType = (typeof partnerNudgeTypes)[number];

export type PartnerNudge = {
  id: string;
  couple_id: string;
  created_by: string;
  type: PartnerNudgeType;
  created_at: string;
};
