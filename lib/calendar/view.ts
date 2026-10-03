import { addDays, addMonths, addWeeks, endOfMonth, endOfWeek, isSameDay, startOfDay, startOfMonth, startOfWeek } from 'date-fns';
import type { CalendarEntry } from '../../types/calendar.ts';

export type CalendarView = 'Day' | 'Week' | 'Month';
export type CalendarFilter = 'Mine' | 'Partner' | 'Together';
export function calendarWindow(anchor: Date, view: CalendarView) {
  if (view === 'Day') { const start = startOfDay(anchor); return { start, end: addDays(start, 1) }; }
  if (view === 'Week') { const start = startOfWeek(anchor, { weekStartsOn: 1 }); return { start, end: addWeeks(start, 1) }; }
  const start = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 });
  const end = addDays(endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 }), 1);
  return { start, end };
}
export function moveCalendar(anchor: Date, view: CalendarView, offset: number) {
  if (view === 'Day') return addDays(anchor, offset);
  if (view === 'Week') return addWeeks(anchor, offset);
  return addMonths(anchor, offset);
}
export function eventsOnDay(events: readonly CalendarEntry[], day: Date) {
  const start = startOfDay(day).getTime();
  const end = addDays(startOfDay(day), 1).getTime();
  return events.filter((event) => Date.parse(event.start_at) < end && Date.parse(event.end_at) > start);
}
export function filterCalendar(events: readonly CalendarEntry[], filter: CalendarFilter, userId: string) {
  return events.filter((event) => filter === 'Mine' ? event.owner_id === userId && event.visibility === 'private' : filter === 'Partner' ? event.owner_id !== userId && event.visibility === 'private' : event.visibility === 'shared');
}
export function calendarDayMatches(a: Date, b: Date) { return isSameDay(a, b); }
