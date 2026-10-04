import type { CalendarEntry, CalendarEventInput } from '../../types/calendar.ts';

export type CalendarConflict = {
  entry: CalendarEntry;
  reason: 'mine' | 'partner' | 'together';
};

function overlaps(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && endA > startB;
}

export function findCalendarConflicts(
  input: Pick<CalendarEventInput, 'start_at' | 'end_at' | 'visibility'>,
  entries: readonly CalendarEntry[],
  userId: string,
  excludeId?: string,
): CalendarConflict[] {
  const start = Date.parse(input.start_at);
  const end = Date.parse(input.end_at);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];

  return entries.flatMap<CalendarConflict>((entry) => {
    if (entry.id && entry.id === excludeId) return [];
    if (!overlaps(start, end, Date.parse(entry.start_at), Date.parse(entry.end_at))) return [];

    if (input.visibility === 'private') {
      if (entry.visibility === 'shared') return [{ entry, reason: 'together' as const }];
      if (entry.owner_id === userId) return [{ entry, reason: 'mine' as const }];
      return [];
    }

    if (entry.visibility === 'shared') return [{ entry, reason: 'together' as const }];
    return [{ entry, reason: entry.owner_id === userId ? 'mine' as const : 'partner' as const }];
  });
}

export function calendarConflictMessage(conflicts: readonly CalendarConflict[]) {
  const first = conflicts[0];
  if (!first) return undefined;
  if (first.reason === 'partner') return 'Your partner is already busy at that time.';
  if (first.reason === 'together') return 'You already have something together at that time.';
  return 'You already have something at that time.';
}
