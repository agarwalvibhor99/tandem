import { format, isBefore, isToday, isTomorrow, setHours, startOfDay } from 'date-fns';
/** Date-only picker stores local noon to avoid local midnight/DST ambiguity. */
export const dueDateValue = (day: Date) => setHours(startOfDay(day), 12).toISOString();
export function dueDateLabel(value: string | null) {
  if (!value) return 'No due date';
  const day = new Date(value);
  if (isToday(day)) return `Today at ${format(day, 'h:mm a')}`;
  if (isTomorrow(day)) return `Tomorrow at ${format(day, 'h:mm a')}`;
  return format(day, 'MMM d, yyyy · h:mm a');
}
export const isTaskOverdue = (value: string | null, now: Date) => !!value && isBefore(new Date(value), startOfDay(now));
