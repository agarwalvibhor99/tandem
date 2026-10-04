import assert from 'node:assert/strict';
import test from 'node:test';
import { findCalendarConflicts, calendarConflictMessage } from '../lib/calendar/conflicts.ts';
import { findSharedFreeTime, mostUsefulFreeTime, sharedFreeTimeForEntries } from '../lib/calendar/free-time.ts';
import { createCalendarEventSchema } from '../lib/validation/calendar.ts';
import { calendarWindow, eventsOnDay, filterCalendar } from '../lib/calendar/view.ts';
import type { CalendarEntry } from '../types/calendar.ts';

const at = (hour: number, minute = 0) => new Date(Date.UTC(2026, 9, 3, hour, minute));
const block = (start: number, end: number) => ({ start: at(start), end: at(end) });
const hours = (intervals: ReturnType<typeof findSharedFreeTime>) => intervals.map(({ start, end }) => [start.getUTCHours(), end.getUTCHours()]);

test('shared free time merges both partners and starts after the later workday', () => {
  assert.deepEqual(hours(findSharedFreeTime([block(9, 17)], [block(10, 18)], at(9), at(22), 30)), [[18, 22]]);
});
test('overlap, adjacent blocks, unsorted input and out-of-day bounds normalize into gaps', () => {
  assert.deepEqual(hours(findSharedFreeTime([block(15, 17), block(7, 10)], [block(9, 11), block(11, 12)], at(8), at(20), 30)), [[12, 15], [17, 20]]);
});
test('short gaps are removed and an exact minimum is retained', () => {
  assert.deepEqual(hours(findSharedFreeTime([block(9, 11), block(12, 15)], [], at(9), at(18), 60)), [[11, 12], [15, 18]]);
  assert.deepEqual(hours(findSharedFreeTime([block(9, 11), block(11, 18)], [], at(9), at(18), 1)), []);
});
test('empty schedules, invalid blocks and invalid bounds are handled deliberately', () => {
  assert.deepEqual(hours(findSharedFreeTime([], [], at(8), at(20), 30)), [[8, 20]]);
  assert.deepEqual(hours(findSharedFreeTime([{ start: at(12), end: at(10) }], [], at(8), at(20), 30)), [[8, 20]]);
  assert.throws(() => findSharedFreeTime([], [], at(20), at(8), 30), RangeError);
  assert.throws(() => findSharedFreeTime([], [], at(8), at(20), -1), RangeError);
});
test('event validation requires ordered times and an actual shared space', () => {
  const calendarEventSchema = createCalendarEventSchema(at(8));
  const base = { couple_id: null, title: 'Dinner', start_at: at(18).toISOString(), end_at: at(19).toISOString(), visibility: 'private', location: '', notes: '', reminder_offset_minutes: null };
  assert.equal(calendarEventSchema.safeParse(base).success, true);
  assert.equal(calendarEventSchema.safeParse({ ...base, end_at: at(17).toISOString() }).success, false);
  assert.equal(calendarEventSchema.safeParse({ ...base, visibility: 'shared' }).success, false);
  assert.equal(calendarEventSchema.safeParse({ ...base, start_at: at(7).toISOString() }).success, false);
});
test('calendar month stays within RPC bounds and overlapping midnight events appear on both days', () => {
  const window = calendarWindow(new Date(2026, 9, 3), 'Month');
  assert.ok((window.end.getTime() - window.start.getTime()) / 86_400_000 <= 43);
  const entry = { id: 'one', owner_id: 'A', title: 'Late trip', start_at: '2026-10-03T23:00:00', end_at: '2026-10-04T01:00:00', visibility: 'private' } as CalendarEntry;
  assert.equal(eventsOnDay([entry], new Date(2026, 9, 3)).length, 1);
  assert.equal(eventsOnDay([entry], new Date(2026, 9, 4)).length, 1);
});
test('shared events appear for both partners, while private details stay in their owner filter', () => {
  const mine = { owner_id: 'A', visibility: 'private' } as CalendarEntry;
  const partner = { owner_id: 'B', visibility: 'private' } as CalendarEntry;
  const shared = { owner_id: 'B', visibility: 'shared' } as CalendarEntry;
  assert.deepEqual(filterCalendar([mine, partner, shared], 'Mine', 'A'), [mine]);
  assert.deepEqual(filterCalendar([mine, partner, shared], 'Partner', 'A'), [partner]);
  assert.deepEqual(filterCalendar([mine, partner, shared], 'Together', 'A'), [shared]);
});
test('shared entries block both calendars and longest available stretch wins', () => {
  const entries = [
    { owner_id: 'A', visibility: 'shared', start_at: at(12).toISOString(), end_at: at(14).toISOString() },
    { owner_id: 'B', visibility: 'private', start_at: at(16).toISOString(), end_at: at(17).toISOString() },
  ] as CalendarEntry[];
  const free = sharedFreeTimeForEntries(entries, 'A', 'B', at(9), at(20), 30);
  assert.deepEqual(hours(free), [[9, 12], [14, 16], [17, 20]]);
  assert.deepEqual(mostUsefulFreeTime(free), free[0]);
});
test('calendar conflicts match private and shared visibility rules', () => {
  const entries = [
    { id: 'mine', owner_id: 'A', visibility: 'private', start_at: at(12).toISOString(), end_at: at(13).toISOString(), title: 'Mine' },
    { id: 'partner', owner_id: 'B', visibility: 'private', start_at: at(14).toISOString(), end_at: at(15).toISOString(), title: 'Busy' },
    { id: 'shared', owner_id: 'A', visibility: 'shared', start_at: at(16).toISOString(), end_at: at(17).toISOString(), title: 'Together' },
  ] as CalendarEntry[];
  const base = { start_at: at(12, 30).toISOString(), end_at: at(13, 30).toISOString(), visibility: 'private' as const };
  assert.equal(findCalendarConflicts(base, entries, 'A')[0]?.reason, 'mine');
  assert.equal(findCalendarConflicts({ ...base, start_at: at(14, 30).toISOString(), end_at: at(15, 30).toISOString() }, entries, 'A').length, 0);
  assert.equal(findCalendarConflicts({ ...base, start_at: at(16, 30).toISOString(), end_at: at(17, 30).toISOString() }, entries, 'A')[0]?.reason, 'together');
  assert.equal(findCalendarConflicts({ ...base, visibility: 'shared', start_at: at(14, 30).toISOString(), end_at: at(15, 30).toISOString() }, entries, 'A')[0]?.reason, 'partner');
  assert.equal(calendarConflictMessage(findCalendarConflicts({ ...base, visibility: 'shared', start_at: at(14, 30).toISOString(), end_at: at(15, 30).toISOString() }, entries, 'A')), 'Your partner is already busy at that time.');
});
