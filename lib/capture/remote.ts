import { getSupabaseClient } from '@/lib/supabase/client';
import { captureKinds, type CaptureConfidence, type CaptureKind, type CaptureSuggestion } from '@/types/capture';

export function isCaptureAiEnabled() {
  return process.env.EXPO_PUBLIC_CAPTURE_AI_ENABLED === 'true';
}

function confidenceFromScore(score: number): CaptureConfidence {
  if (score >= 0.85) return 'high';
  if (score >= 0.6) return 'medium';
  return 'low';
}

function parseRemoteSuggestion(value: unknown, originalText: string): CaptureSuggestion | null {
  if (!value || typeof value !== 'object') return null;
  const result = value as Record<string, unknown>;
  const kind = typeof result.kind === 'string' && captureKinds.includes(result.kind as CaptureKind) ? result.kind as CaptureKind : null;
  const title = typeof result.title === 'string' ? result.title.trim() : '';
  const score = typeof result.confidence === 'number' ? result.confidence : -1;
  if (!kind || !title || title.length > 160 || score < 0 || score > 1) return null;
  const suggestion: CaptureSuggestion = {
    kind,
    title,
    originalText,
    confidence: confidenceFromScore(score),
    rationale: typeof result.rationale === 'string' && result.rationale.length <= 240 ? result.rationale : 'A cloud classifier found a possible match.',
  };
  if (typeof result.amount === 'string' && /^\d+(\.\d{1,2})?$/.test(result.amount)) suggestion.amount = Number(result.amount).toFixed(2);
  if (typeof result.scheduledAt === 'string' && !Number.isNaN(Date.parse(result.scheduledAt))) suggestion.scheduledAt = new Date(result.scheduledAt).toISOString();
  return suggestion;
}

export async function classifyCaptureRemotely(originalText: string): Promise<CaptureSuggestion | null> {
  if (!isCaptureAiEnabled()) return null;
  try {
    const { data, error } = await getSupabaseClient().functions.invoke('classify-capture', {
      body: { text: originalText, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, locale: Intl.DateTimeFormat().resolvedOptions().locale },
    });
    if (error) return null;
    return parseRemoteSuggestion(data, originalText);
  } catch {
    return null;
  }
}
