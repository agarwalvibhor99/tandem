import type { CalendarEntry, TimeInterval } from '../../types/calendar.ts';

/** Returns non-overlapping free intervals in [dayStart, dayEnd). */
export function findSharedFreeTime(
  partnerABusy: readonly TimeInterval[], partnerBBusy: readonly TimeInterval[],
  dayStart: Date, dayEnd: Date, minimumFreeMinutes: number,
): TimeInterval[] {
  const lower = dayStart.getTime();
  const upper = dayEnd.getTime();
  if (!Number.isFinite(lower) || !Number.isFinite(upper) || upper <= lower) throw new RangeError('Invalid day bounds');
  if (!Number.isFinite(minimumFreeMinutes) || minimumFreeMinutes < 0) throw new RangeError('Invalid minimum duration');
  const busy = [...partnerABusy, ...partnerBBusy]
    .map(({ start, end }) => ({ start: Math.max(lower, start.getTime()), end: Math.min(upper, end.getTime()) }))
    .filter(({ start, end }) => Number.isFinite(start) && Number.isFinite(end) && end > start)
    .sort((a, b) => a.start - b.start || a.end - b.end);
  const gaps: TimeInterval[] = [];
  let cursor = lower;
  const addGap = (end: number) => {
    if (end > cursor && end - cursor >= minimumFreeMinutes * 60_000) gaps.push({ start: new Date(cursor), end: new Date(end) });
  };
  for (const block of busy) {
    if (block.start > cursor) addGap(block.start);
    cursor = Math.max(cursor, block.end);
  }
  addGap(upper);
  return gaps;
}

/** Shared events occupy both calendars regardless of which member created them. */
export function sharedFreeTimeForEntries(entries: readonly CalendarEntry[], userId: string, partnerId: string, start: Date, end: Date, minimumFreeMinutes: number) {
  const blocksFor = (id: string) => entries
    .filter((entry) => entry.owner_id === id || entry.visibility === 'shared')
    .map((entry) => ({ start: new Date(entry.start_at), end: new Date(entry.end_at) }));
  return findSharedFreeTime(blocksFor(userId), blocksFor(partnerId), start, end, minimumFreeMinutes);
}
export function mostUsefulFreeTime(blocks: readonly TimeInterval[]) {
  return blocks.reduce<TimeInterval | undefined>((best, next) => !best || next.end.getTime() - next.start.getTime() > best.end.getTime() - best.start.getTime() ? next : best, undefined);
}
