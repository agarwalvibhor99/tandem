export const captureKinds = ['task', 'grocery', 'expense', 'event', 'reminder'] as const;

export type CaptureKind = (typeof captureKinds)[number];
export type CaptureConfidence = 'high' | 'medium' | 'low';

export type CaptureSuggestion = {
  kind: CaptureKind;
  title: string;
  originalText: string;
  confidence: CaptureConfidence;
  rationale: string;
  amount?: string;
  scheduledAt?: string;
};
