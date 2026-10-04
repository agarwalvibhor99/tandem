import type { ReminderRecurrence } from '@/types/reminder';
import { addDays, set } from 'date-fns';

export type ReminderSchedule =
  | { kind: 'date'; date: Date }
  | { kind: 'daily'; hour: number; minute: number }
  | { kind: 'weekly'; weekday: number; hour: number; minute: number }
  | { kind: 'monthly'; day: number; hour: number; minute: number };

/**
 * Converts a reminder's first occurrence into the small schedule shape used
 * by notification adapters. The monthly day is capped at 28 so a reminder
 * created on the 29th, 30th, or 31st still fires in every month.
 */
export function reminderSchedule(remindAt: string, recurrence: ReminderRecurrence): ReminderSchedule {
  const date = new Date(remindAt);

  if (recurrence === 'none') return { kind: 'date', date };

  const hour = date.getHours();
  const minute = date.getMinutes();

  if (recurrence === 'daily') return { kind: 'daily', hour, minute };
  if (recurrence === 'weekly') return { kind: 'weekly', weekday: date.getDay() + 1, hour, minute };
  return { kind: 'monthly', day: Math.min(date.getDate(), 28), hour, minute };
}

/** Returns the next local occurrence for dashboard/list display, or null when a one-off is past. */
export function nextReminderOccurrence(remindAt: string, recurrence: ReminderRecurrence, now = new Date()): Date | null {
  const source = new Date(remindAt);
  if (recurrence === 'none') return source > now ? source : null;

  const time = { hours: source.getHours(), minutes: source.getMinutes(), seconds: 0, milliseconds: 0 };
  if (recurrence === 'daily') {
    let next = set(now, time);
    if (next <= now) next = addDays(next, 1);
    return next;
  }
  if (recurrence === 'weekly') {
    const targetDay = source.getDay();
    const daysUntil = (targetDay - now.getDay() + 7) % 7;
    let next = set(addDays(now, daysUntil), time);
    if (next <= now) next = addDays(next, 7);
    return next;
  }

  const day = Math.min(source.getDate(), 28);
  const thisMonth = set(now, { date: 1, ...time });
  thisMonth.setDate(day);
  if (thisMonth > now) return thisMonth;
  const nextMonth = set(addDays(set(now, { date: 1 }), 32), { date: 1, ...time });
  nextMonth.setDate(day);
  return nextMonth;
}
