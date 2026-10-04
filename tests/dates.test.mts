import assert from 'node:assert/strict';
import test from 'node:test';
import { recommendDateIdeas } from '../lib/dates/planner.ts';
import type { DateIdea } from '../types/date-idea.ts';

const base: DateIdea = {
  id: 'one', couple_id: 'space', created_by: 'alex', title: 'Dinner', category: 'food',
  cost_level: 2, duration_minutes: 120, location: '', notes: '', status: 'want_to_do',
  created_at: '2026-10-03T00:00:00Z', updated_at: '2026-10-03T00:00:00Z',
};
const free = [{ start: new Date('2026-10-03T18:30:00Z'), end: new Date('2026-10-03T22:30:00Z') }];

test('planner fits a saved idea wholly inside common free time', () => {
  const matches = recommendDateIdeas([base], free, { budget: 2, category: 'food', mood: 'relaxed' });
  assert.equal(matches.length, 1);
  const first = matches[0];
  assert.ok(first);
  assert.equal(first.slot.start.toISOString(), '2026-10-03T18:30:00.000Z');
  assert.equal(first.slot.end.toISOString(), '2026-10-03T20:30:00.000Z');
});

test('budget, mood, category, status and duration exclude unsuitable plans', () => {
  const ideas: DateIdea[] = [base,
    { ...base, id: 'expensive', title: 'Tasting menu', cost_level: 4 },
    { ...base, id: 'active', title: 'Hike', category: 'outdoor' },
    { ...base, id: 'done', title: 'Past dinner', status: 'done' },
    { ...base, id: 'long', title: 'Long dinner', duration_minutes: 360 },
  ];
  assert.deepEqual(recommendDateIdeas(ideas, free, { budget: 2, category: 'food', mood: 'relaxed' }).map(({ idea }) => idea.id), ['one']);
  const firstBlock = free[0];
  assert.ok(firstBlock);
  assert.deepEqual(recommendDateIdeas([base], [{ start: firstBlock.start, end: new Date('2026-10-03T20:29:00Z') }], { budget: 2, category: 'any', mood: 'any' }), []);
});
