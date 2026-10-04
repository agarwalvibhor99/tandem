import assert from 'node:assert/strict';
import test from 'node:test';
import { nextReminderOccurrence, reminderSchedule } from '../lib/reminders/recurrence.ts';

function localIso(year: number, month: number, day: number, hour: number, minute: number) {
  return new Date(year, month - 1, day, hour, minute, 0, 0).toISOString();
}

test('one-time reminders keep their exact first occurrence', () => {
  const remindAt = localIso(2026, 10, 5, 9, 30);
  const schedule = reminderSchedule(remindAt, 'none');

  assert.equal(schedule.kind, 'date');
  if (schedule.kind === 'date') assert.equal(schedule.date.getTime(), new Date(remindAt).getTime());
});

test('daily reminders preserve the local time', () => {
  const schedule = reminderSchedule(localIso(2026, 10, 5, 9, 30), 'daily');

  assert.deepEqual(schedule, { kind: 'daily', hour: 9, minute: 30 });
});

test('weekly reminders use Expo weekday numbering', () => {
  const schedule = reminderSchedule(localIso(2026, 10, 4, 18, 15), 'weekly');

  assert.deepEqual(schedule, { kind: 'weekly', weekday: 1, hour: 18, minute: 15 });
});

test('monthly reminders clamp late month days to a safe day', () => {
  const schedule = reminderSchedule(localIso(2026, 10, 31, 8, 0), 'monthly');

  assert.deepEqual(schedule, { kind: 'monthly', day: 28, hour: 8, minute: 0 });
});

test('repeating reminders resolve their next local occurrence after their stored start date', () => {
  const now = new Date(2026, 9, 5, 10, 0, 0);
  const daily = nextReminderOccurrence(localIso(2026, 9, 1, 9, 30), 'daily', now);
  const weekly = nextReminderOccurrence(localIso(2026, 9, 6, 9, 30), 'weekly', now);
  const monthly = nextReminderOccurrence(localIso(2026, 10, 31, 9, 30), 'monthly', now);

  assert.equal(daily?.getTime(), new Date(2026, 9, 6, 9, 30).getTime());
  assert.equal(weekly?.getTime(), new Date(2026, 9, 11, 9, 30).getTime());
  assert.equal(monthly?.getTime(), new Date(2026, 9, 28, 9, 30).getTime());
});

test('past one-time reminders are omitted from upcoming reminders', () => {
  assert.equal(nextReminderOccurrence(localIso(2026, 9, 1, 9, 30), 'none', new Date(2026, 9, 5)), null);
});
