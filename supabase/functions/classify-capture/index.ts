// Supabase Edge Function runtime (Deno). This directory is deployed with the
// Supabase CLI and is excluded from the Expo TypeScript project.
// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const allowedKinds = ['task', 'grocery', 'expense', 'event', 'reminder'];
const responseSchema = {
  type: 'OBJECT',
  properties: {
    kind: { type: 'STRING', enum: allowedKinds },
    title: { type: 'STRING' },
    amount: { type: 'STRING', nullable: true },
    scheduledAt: { type: 'STRING', nullable: true },
    confidence: { type: 'NUMBER' },
    rationale: { type: 'STRING' },
  },
  required: ['kind', 'title', 'confidence', 'rationale'],
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function validResult(value: unknown) {
  if (!value || typeof value !== 'object') return false;
  const result = value as Record<string, unknown>;
  return allowedKinds.includes(String(result.kind))
    && typeof result.title === 'string'
    && result.title.trim().length > 0
    && result.title.length <= 160
    && typeof result.confidence === 'number'
    && result.confidence >= 0
    && result.confidence <= 1
    && typeof result.rationale === 'string'
    && result.rationale.length <= 240
    && (result.amount === undefined || result.amount === null || /^\d+(\.\d{1,2})?$/.test(String(result.amount)))
    && (result.scheduledAt === undefined || result.scheduledAt === null || !Number.isNaN(Date.parse(String(result.scheduledAt))));
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ code: 'method_not_allowed' }, 405);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: request.headers.get('Authorization') ?? '' } },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ code: 'unauthorized' }, 401);

  let body: { text?: unknown; timezone?: unknown; locale?: unknown };
  try { body = await request.json(); } catch { return json({ code: 'invalid_json' }, 400); }
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text || text.length > 300) return json({ code: 'invalid_capture_text' }, 400);

  const { data: allowed, error: quotaError } = await supabase.rpc('consume_capture_ai_quota');
  if (quotaError) return json({ code: 'quota_unavailable' }, 503);
  if (!allowed) return json({ code: 'capture_rate_limited', retryAfter: 'next UTC day' }, 429);

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) return json({ code: 'ai_unconfigured' }, 503);
  const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';
  const prompt = [
    'Classify one Tandem quick-capture sentence.',
    'Return only JSON matching the supplied schema.',
    'Never invent an amount, date, time, person, visibility, or assignment.',
    `User timezone: ${typeof body.timezone === 'string' ? body.timezone.slice(0, 80) : 'unknown'}`,
    `User locale: ${typeof body.locale === 'string' ? body.locale.slice(0, 40) : 'unknown'}`,
    `Sentence: ${text}`,
  ].join('\n');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST', signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0, responseMimeType: 'application/json', responseSchema } }),
    });
    if (!response.ok) return json({ code: 'ai_provider_error' }, 502);
    const payload = await response.json();
    const raw = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    let result: unknown;
    try { result = JSON.parse(raw); } catch { return json({ code: 'ai_invalid_output' }, 502); }
    if (!validResult(result)) return json({ code: 'ai_invalid_output' }, 502);
    return json(result);
  } catch (error) {
    return json({ code: error?.name === 'AbortError' ? 'ai_timeout' : 'ai_provider_error' }, 502);
  } finally {
    clearTimeout(timeout);
  }
});
