import type { CaptureKind, CaptureSuggestion } from '@/types/capture';

const groceryWords = /\b(milk|eggs?|bread|bananas?|apples?|chicken|rice|cheese|yogurt|vegetables?|fruit|coffee|tea|toilet paper|detergent|grocer(?:y|ies))\b/i;
const groceryIntent = /\b(add (?:to )?(?:the )?(?:grocery|shopping) list|grocery list|pick up|get some)\b/i;
const expenseIntent = /\b(spent|paid|expense|cost|bought|charged|receipt)\b/i;
const reminderIntent = /^(?:please\s+)?remind(?:er)?\b|\bset (?:a )?reminder\b/i;
const eventIntent = /\b(meeting|appointment|reservation|dinner|lunch|breakfast|date night|call with|coffee with|party|flight|concert|event)\b/i;
const timeExpression = /\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i;
const amountExpression = /(?:\$|usd\s*)(\d+(?:\.\d{1,2})?)\b/i;

function tidyTitle(value: string) {
  return value
    .replace(/^(?:please\s+)?remind me(?:\s+to)?\s+/i, '')
    .replace(/^set (?:a )?reminder(?:\s+to)?\s+/i, '')
    .replace(/^add (?:to )?(?:the )?(?:grocery|shopping) list\s*/i, '')
    .replace(/^(?:spent|paid)\s+(?:\$|usd\s*)?\d+(?:\.\d{1,2})?\s*(?:on|for)?\s*/i, '')
    .replace(/^(?:log|add) (?:an? )?expense(?:\s+for)?\s*/i, '')
    .replace(/(?:\$|usd\s*)\d+(?:\.\d{1,2})?/gi, '')
    .replace(/\b(?:today|tomorrow|next week)(?:\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?\b/gi, '')
    .replace(/\b(?:on\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/^[,.:;\s-]+|[,.:;\s-]+$/g, '')
    .trim();
}

function parseAmount(text: string) {
  const direct = text.match(amountExpression)?.[1];
  if (direct) return Number(direct).toFixed(2);
  const contextual = text.match(/\b(?:spent|paid|cost|expense)\s+(\d+(?:\.\d{1,2})?)\b/i)?.[1];
  return contextual ? Number(contextual).toFixed(2) : undefined;
}

function nextWeekday(from: Date, weekday: number) {
  const result = new Date(from);
  const delta = ((weekday - result.getDay() + 7) % 7) || 7;
  result.setDate(result.getDate() + delta);
  return result;
}

function parseScheduledAt(text: string, now: Date) {
  let date: Date | undefined;
  if (/\btomorrow\b/i.test(text)) {
    date = new Date(now);
    date.setDate(date.getDate() + 1);
  } else if (/\bnext week\b/i.test(text)) {
    date = new Date(now);
    date.setDate(date.getDate() + 7);
  } else if (/\btoday\b/i.test(text)) {
    date = new Date(now);
  } else {
    const weekdayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const weekday = weekdayNames.findIndex((name) => new RegExp(`\\b${name}\\b`, 'i').test(text));
    if (weekday >= 0) date = nextWeekday(now, weekday);
  }

  const time = text.match(timeExpression);
  if (!date && !time) return undefined;
  date ??= new Date(now);
  if (time) {
    let hour = Number(time[1]);
    const minute = Number(time[2] ?? 0);
    const meridiem = time[3]?.toLowerCase();
    if (meridiem === 'pm' && hour < 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;
    date.setHours(hour, minute, 0, 0);
  } else {
    date.setHours(9, 0, 0, 0);
  }
  return date.toISOString();
}

function inferKind(text: string, amount: string | undefined, scheduledAt: string | undefined): Pick<CaptureSuggestion, 'kind' | 'confidence' | 'rationale'> {
  if (reminderIntent.test(text)) return { kind: 'reminder', confidence: 'high', rationale: 'You asked Tandem to remind you.' };
  if (amount && (expenseIntent.test(text) || amountExpression.test(text))) return { kind: 'expense', confidence: 'high', rationale: 'An amount was included.' };
  if (groceryIntent.test(text) || (groceryWords.test(text) && /\b(add|buy|get|need|pick up)\b/i.test(text))) return { kind: 'grocery', confidence: 'high', rationale: 'This looks like something for a shared list.' };
  if (eventIntent.test(text) && scheduledAt) return { kind: 'event', confidence: 'high', rationale: 'A plan and time were included.' };
  if (scheduledAt && /\b(at|on|today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(text)) return { kind: 'event', confidence: 'medium', rationale: 'A specific time was included.' };
  return { kind: 'task', confidence: 'medium', rationale: 'This reads like something to do.' };
}

export function classifyCapture(input: string, now = new Date()): CaptureSuggestion {
  const originalText = input.trim();
  const amount = parseAmount(originalText);
  const scheduledAt = parseScheduledAt(originalText, now);
  const inferred = inferKind(originalText, amount, scheduledAt);
  const title = tidyTitle(originalText) || originalText;
  return { ...inferred, title, originalText, ...(amount ? { amount } : {}), ...(scheduledAt ? { scheduledAt } : {}) };
}

export function chooseCaptureKind(suggestion: CaptureSuggestion, kind: CaptureKind): CaptureSuggestion {
  return { ...suggestion, kind, confidence: 'high', rationale: 'Type chosen by you.' };
}
