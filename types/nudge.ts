export const partnerNudgeTypes = ['rose', 'heart', 'coffee', 'beer'] as const;
export type PartnerNudgeType = (typeof partnerNudgeTypes)[number];
export const partnerNudgeStatuses = ['visible', 'hidden'] as const;
export type PartnerNudgeStatus = (typeof partnerNudgeStatuses)[number];

export type PartnerNudge = {
  id: string;
  couple_id: string;
  created_by: string;
  type: PartnerNudgeType;
  status: PartnerNudgeStatus;
  created_at: string;
};
