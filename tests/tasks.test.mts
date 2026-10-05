import assert from 'node:assert/strict';
import test from 'node:test';
import { createClient } from '@supabase/supabase-js';
import { MutationObserver, QueryClient } from '@tanstack/react-query';
import { createTaskApi } from '../lib/tasks/api.ts';
import { taskMatches, taskDateBounds } from '../lib/tasks/filters.ts';
import { dueDateValue } from '../lib/tasks/dates.ts';
import { taskSchema } from '../lib/validation/task.ts';
import { completionOptions, projectTaskList, taskKeys, type CompletionChange } from '../lib/tasks/optimistic.ts';
import type { Task, TaskInput } from '../types/task.ts';
import type { Database } from '../types/database.ts';

const user = 'bbbbbbbb-0000-4000-8000-000000000001';
const partner = 'bbbbbbbb-0000-4000-8000-000000000002';
const space = 'bbbbbbbb-0000-4000-8000-000000000003';
const base: Task = { id: 'cccccccc-0000-4000-8000-000000000001', title: 'Book the car service', description: '', couple_id: null, created_by: user, assigned_to: user, visibility: 'private', due_at: null, reminder_offset_minutes: null, category: 'Errands', priority: 'normal', status: 'open', completed_at: null, created_at: '2026-10-01T12:00:00.000Z', updated_at: '2026-10-01T12:00:00.000Z' };
const tomorrow = '2026-10-04T00:00:00.000Z';

test('task validation: sharing requires space; bounded title and notes; date format', () => {
  assert.equal(taskSchema.parse(base).title, base.title);
  assert.equal(taskSchema.parse({ ...base, title: '  Call dentist  ' }).title, 'Call dentist');
  for (const input of [{ title: '' }, { title: ' '.repeat(5) }, { title: 'a'.repeat(161) }, { description: 'a'.repeat(4001) }, { visibility: 'shared' }, { couple_id: space }, { due_at: '2026-10-03' }]) assert.equal(taskSchema.safeParse({ ...base, ...input }).success, false);
  assert.equal(taskSchema.safeParse({ ...base, visibility: 'shared', couple_id: space, assigned_to: partner }).success, true);
});
test('all six filters: overdue, midnight, no date, responsibility and completed exclusion', () => {
  const overdue = { ...base, due_at: '2026-10-02T12:00:00Z' };
  assert.equal(taskMatches(overdue, 'Today', user, tomorrow), true);
  assert.equal(taskMatches(base, 'Today', user, tomorrow), false);
  assert.equal(taskMatches(base, 'Upcoming', user, tomorrow), true);
  const midnight = { ...base, due_at: '2026-10-04T00:00:00.000+00:00' };
  assert.equal(taskMatches(midnight, 'Today', user, tomorrow), false);
  assert.equal(taskMatches(midnight, 'Upcoming', user, tomorrow), true);
  assert.equal(taskMatches(base, 'Mine', user, tomorrow), true);
  const shared = { ...base, visibility: 'shared' as const, couple_id: space, assigned_to: partner };
  assert.equal(taskMatches(shared, 'Mine', user, tomorrow), false);
  assert.equal(taskMatches(shared, 'Partner', user, tomorrow), true);
  assert.equal(taskMatches({ ...shared, assigned_to: null }, 'Partner', user, tomorrow), false);
  assert.equal(taskMatches(shared, 'Shared', user, tomorrow), true);
  assert.equal(taskMatches(base, 'Shared', user, tomorrow), false);
  for (const filter of ['Today', 'Upcoming', 'Mine', 'Partner', 'Shared'] as const) assert.equal(taskMatches({ ...shared, ...overdue, status: 'completed' }, filter, user, tomorrow), false);
  assert.equal(taskMatches({ ...base, status: 'completed' }, 'Completed', user, tomorrow), true);
});
test('local date bounds respect DST rather than assuming 24-hour days', () => {
  const original = process.env.TZ;
  process.env.TZ = 'America/Los_Angeles';
  try {
    const spring = taskDateBounds(new Date('2026-03-08T12:00:00-07:00'));
    const fall = taskDateBounds(new Date('2026-11-01T12:00:00-08:00'));
    assert.equal(Date.parse(spring.tomorrow) - Date.parse(spring.today), 23 * 3600_000);
    assert.equal(Date.parse(fall.tomorrow) - Date.parse(fall.today), 25 * 3600_000);
    assert.equal(new Date(dueDateValue(new Date('2026-03-08T00:00:00-08:00'))).getHours(), 12);
  } finally { if (original === undefined) delete process.env.TZ; else process.env.TZ = original; }
});
test('real Supabase query builder: six filters, pagination and abort-aware reads', async () => {
  const requests: URL[] = [];
  const client = createClient<Database>('https://tasks.example.test', 'test-public-key', { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: async (input) => { requests.push(new URL(String(input))); return new Response('[]', { headers: { 'Content-Type': 'application/json' } }); } } });
  const api = createTaskApi(client);
  for (const filter of ['Today', 'Upcoming', 'Mine', 'Partner', 'Shared', 'Completed'] as const) await api.list(filter, user, tomorrow, 0);
  assert.equal(requests[0]!.searchParams.get('due_at'), `lt.${tomorrow}`);
  assert.equal(requests[1]!.searchParams.get('or'), `(due_at.gte.${tomorrow},due_at.is.null)`);
  assert.equal(requests[2]!.searchParams.get('or'), `(visibility.eq.private,assigned_to.eq.${user})`);
  assert.equal(requests[3]!.searchParams.get('visibility'), 'eq.shared');
  assert.deepEqual(requests[3]!.searchParams.getAll('assigned_to'), ['not.is.null', `neq.${user}`]);
  assert.equal(requests[4]!.searchParams.get('visibility'), 'eq.shared');
  assert.equal(requests[5]!.searchParams.get('status'), 'eq.completed');
  await api.list('Mine', user, tomorrow, 1);
  assert.equal(requests[6]!.searchParams.get('offset'), '30');
  assert.equal(requests[6]!.searchParams.get('limit'), '30');
});
test('real Supabase mutation builder never sends creator or timestamps; edits use version precondition', async () => {
  const requests: { url: URL; method: string; body: Record<string, unknown> }[] = [];
  const client = createClient<Database>('https://tasks.example.test', 'test-public-key', { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: async (input, init) => {
    requests.push({ url: new URL(String(input)), method: init?.method ?? '', body: JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown> });
    return new Response(JSON.stringify(base), { headers: { 'Content-Type': 'application/json' } });
  } } });
  const api = createTaskApi(client);
  const input: TaskInput = taskSchema.parse(base);
  await api.create(input); await api.edit(base, input); await api.complete(base, 'completed'); await api.remove(base);
  assert.deepEqual(requests.map((r) => r.method), ['POST', 'PATCH', 'PATCH', 'DELETE']);
  assert.equal('created_by' in requests[0]!.body, false);
  assert.equal('updated_at' in requests[0]!.body, false);
  for (const request of requests.slice(1)) assert.equal(request.url.searchParams.get('updated_at'), `eq.${base.updated_at}`);
  assert.deepEqual(requests[2]!.body, { status: 'completed' });
});
test('optimistic completion and reopen project immediately without modifying server cache', () => {
  const completed: CompletionChange[] = [{ task: base, status: 'completed' }];
  assert.equal(projectTaskList([base], completed, 'Mine', user, tomorrow).length, 0);
  assert.equal(projectTaskList([], completed, 'Completed', user, tomorrow)[0]!.status, 'completed');
  assert.equal(base.status, 'open');
  assert.equal(projectTaskList([base], [], 'Mine', user, tomorrow).length, 1);
  const task = { ...base, status: 'completed' as const };
  assert.equal(projectTaskList([task], [{ task, status: 'open' }], 'Mine', user, tomorrow)[0]!.status, 'open');
});
test('TanStack mutation failure rolls back only its task while concurrent completion survives', async () => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } });
  client.setQueryData(taskKeys.detail(user, base.id), base);
  const second = { ...base, id: 'cccccccc-0000-4000-8000-000000000002' };
  const listKey = [...taskKeys.all(user), 'list', 'Mine', tomorrow];
  client.setQueryData(listKey, { pages: [[base, second]], pageParams: [0] });
  let rejectFirst!: (error: Error) => void;
  const failed = new Promise<Task>((_, reject) => { rejectFirst = reject; });
  const firstMutation = new MutationObserver(client, completionOptions(client, user, () => failed));
  const secondMutation = new MutationObserver(client, completionOptions(client, user, async () => ({ ...second, status: 'completed' })));
  const first = firstMutation.mutate({ task: base, status: 'completed' }).catch(() => undefined);
  await secondMutation.mutate({ task: second, status: 'completed' });
  rejectFirst(new Error('Network unavailable'));
  await first;
  assert.equal(firstMutation.getCurrentResult().status, 'error');
  assert.equal(client.getQueryData<Task>(taskKeys.detail(user, base.id))!.status, 'open');
  assert.equal(client.getQueryData<Task>(taskKeys.detail(user, second.id))!.status, 'completed');
  const cachedList = client.getQueryData<{ pages: Task[][] }>(listKey)!;
  assert.deepEqual(cachedList.pages[0]!.map((task) => task.status), ['open', 'completed']);
  const pending = client.getMutationCache().findAll({ mutationKey: taskKeys.completion(user), status: 'pending' });
  assert.equal(pending.length, 0);
  client.clear();
});
